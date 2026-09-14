import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import nodemailer from 'nodemailer'
import { sendCAPIEvent } from '@/lib/meta-capi'
import { sendGA4Event } from '@/lib/ga4-mp'
import { getPopPortador, getPlanoId } from '@/lib/data'
import { sanitizePhoneForSGP } from '@/lib/formatters'
import { buildEmailClienteHtml } from '@/lib/email-cliente'
import { checkCpfInSgp } from '@/lib/sgp-client'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
})

const mailer = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function fetchWithTimeout(url: string, options: RequestInit, ms = 8000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout))
}

function sanitizarNumero(valor: string): string {
  const match = valor.trim().match(/^(\d+[\w/-]*)/)
  return match ? match[1] : (valor.trim() || 'S/N')
}

function parseLogradouro(logradouro: string) {
  const match = logradouro.match(/^(.+?),\s*(\S+)(?:\s*-\s*(.+))?$/)
  if (match) {
    return {
      logradouro: match[1].trim(),
      numero: sanitizarNumero(match[2]),
      complemento: match[3]?.trim() ?? null,
    }
  }
  const matchSemVirgula = logradouro.match(/^(.+?)\s+(\d+\S*)$/)
  if (matchSemVirgula) {
    return {
      logradouro: matchSemVirgula[1].trim(),
      numero: sanitizarNumero(matchSemVirgula[2]),
      complemento: null,
    }
  }
  return { logradouro, numero: 'S/N', complemento: null }
}

export async function POST(request: Request) {
  let body: Record<string, string>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', message: 'Payload inválido' }, { status: 400 })
  }

  const {
    lead_id,
    nome, cpfcnpj, email, celular,
    logradouro: logradouroRaw,
    bairro, cidade, uf, cep,
    observacao,
    token,
    cpf_duplicado,
    origem,
    client_ip_address, client_user_agent, fbp, ga_client_id, session_id,
    // MGM fields
    mgm: isMgm,
    indicador_nome, indicador_primeiro_nome, indicador_tipo,
    indicador_valor, indicador_cpf, indicador_cliente_id, indicador_validado,
  } = body

  const { logradouro, numero, complemento } = parseLogradouro(logradouroRaw ?? '')
  const vencimento = observacao?.match(/Vencimento:\s*Dia\s*(\S+)/)?.[1] ?? ''
  const cidade_cobertura = observacao?.match(/Cidade cobertura:\s*([^|]+)/)?.[1]?.trim() ?? ''
  const bairro_cobertura = observacao?.match(/Bairro cobertura:\s*([^|]+)/)?.[1]?.trim() ?? ''
  const plano_velocidade = observacao?.match(/Plano:\s*(.+?)\s*-/)?.[1]?.trim() ?? ''
  const plano_preco = observacao?.match(/-\s*(.+?)\s*\|/)?.[1]?.trim() ?? ''
  const planoValor = parseFloat(plano_preco.replace(/[^\d,]/g, '').replace(',', '.') || '0')

  const dbLeadId = lead_id ? parseInt(lead_id) : null
  const cpfLimpo = cpfcnpj.replace(/\D/g, '')
  const clientFlagCpfDup = cpf_duplicado === 'true' || cpf_duplicado === true as unknown as string

  // ── Re-verificação server-side do CPF no SGP ────────────────────────────────
  // O front (step-2) já checa duplicidade em tempo real via /api/internal/check-cpf,
  // mas esse resultado NUNCA deve ser a única barreira: o cliente pode manipular o
  // payload, e falhas de rede/timeout no meio do caminho não podem virar cadastro
  // duplicado silencioso no SGP. Re-checamos aqui antes de decidir criar o cliente.
  const cpfCheckServer = await checkCpfInSgp(cpfLimpo)
  const isCpfDup = clientFlagCpfDup || (cpfCheckServer.ok && cpfCheckServer.found)

  // ── 1. Banco — endereço (step 3) ───────────────────────────────────────────
  if (dbLeadId) {
    try {
      await pool.query(
        `UPDATE leads SET
          cep = $1, logradouro = $2, numero = $3, complemento = $4,
          bairro_endereco = $5, cidade_endereco = $6, estado = $7,
          ponto_referencia = $8, step_atual = 3
        WHERE id = $9`,
        [
          cep.replace(/\D/g, ''), logradouro, numero, complemento ?? null,
          bairro, cidade, uf,
          isMgm && indicador_nome
            ? `INDICAÇÃO AMIGO DE FIBRA - indicado por ${indicador_primeiro_nome || indicador_nome} (${indicador_cpf || indicador_valor || 'nome'}) - lead #${dbLeadId}`
            : 'suprimido',
          dbLeadId,
        ]
      )
    } catch (err) {
      console.error('[STEP3 DB ERROR]', err)
    }
  }

  // ── 2. SGP CRM — criar cliente (pular se CPF duplicado) ────────────────────
  let sgpOk = false
  let sgpClienteId: number | null = null
  let sgpMessage = isCpfDup ? 'CPF duplicado — encaminhado ao atendimento' : 'Erro no cadastro'

  const enderecoSgp = {
    logradouro, numero,
    complemento: complemento ?? '',
    bairro, cidade,
    cep: cep.replace(/\D/g, ''),
    uf, pais: 'BR',
    pontoreferencia: isMgm && indicador_nome
      ? `INDICAÇÃO AMIGO DE FIBRA - indicado por ${indicador_primeiro_nome || indicador_nome} (${indicador_cpf || indicador_valor || 'nome'}) - lead #${dbLeadId}`
      : 'suprimido',
  }

  // Detecta PF (11 dígitos) ou PJ (14 dígitos)
  const tipoPessoa = cpfLimpo.length === 14 ? 'J' : 'F'

  if (!isCpfDup) {
    try {
      const sgpEndpoint = tipoPessoa === 'J' ? '/api/crm/cliente/J' : '/api/crm/cliente/F'
      // Celular é opcional no endpoint PJ e o SGP só aceita 11 dígitos nele.
      // Com 10 dígitos (fixo), omitimos o campo em vez de mandar valor rejeitado.
      const celularSgp = sanitizePhoneForSGP(celular)
      const sgpPayload = tipoPessoa === 'J'
        ? {
            app: process.env.SGP_APP ?? '',
            token: process.env.SGP_TOKEN ?? '',
            nome,
            cpfcnpj: cpfLimpo,
            email,
            ...(celularSgp.length === 11 ? { celular: celularSgp } : {}),
            respempresa: nome,
            endereco: enderecoSgp,
          }
        : {
            app: process.env.SGP_APP ?? '',
            token: process.env.SGP_TOKEN ?? '',
            nome,
            cpfcnpj: cpfLimpo,
            email,
            celular: sanitizePhoneForSGP(celular),
            endereco: enderecoSgp,
          }

      const sgpRes = await fetchWithTimeout(
        `${process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'}${sgpEndpoint}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sgpPayload),
        },
        8000
      )
      const sgpData = await sgpRes.json() as Record<string, unknown>
      console.log('[SGP CLIENTE RESPONSE]', JSON.stringify(sgpData))

      if (sgpData.cliente_id) {
        sgpClienteId = sgpData.cliente_id as number
        sgpOk = true
        sgpMessage = 'Cliente criado com sucesso'
      } else {
        sgpMessage = String(
          (sgpData.errors as Record<string, string>)?.cpfcnpj ??
          (sgpData.errors as Record<string, string>)?.message ??
          sgpData.message ?? 'Erro no cadastro'
        )
        console.error('[SGP CLIENTE ERROR]', JSON.stringify(sgpData))
      }
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.name === 'AbortError'
      sgpMessage = isTimeout ? 'Timeout SGP' : 'Erro no cadastro'
      console.error('[SGP CLIENTE EXCEPTION]', err)
    }
  }

  // ── 3. Atualiza banco ──────────────────────────────────────────────────────
  if (dbLeadId) {
    try {
      await pool.query(
        `UPDATE leads SET sgp_status = $1, sgp_response = $2 WHERE id = $3`,
        [
          isCpfDup ? 'cpf_duplicado' : sgpOk ? 'enviado' : 'erro',
          JSON.stringify({ message: sgpMessage, cliente_id: sgpClienteId }),
          dbLeadId,
        ]
      )
    } catch (err) {
      console.error('[DB SGP UPDATE ERROR]', err)
    }
  }

  // ── 4. Fluenzo ─────────────────────────────────────────────────────────────
  try {
    const fluenzoRes = await fetchWithTimeout(
      process.env.FLUENZO_URL ?? '',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: isCpfDup ? false : sgpOk,
          message: sgpMessage,
          cpf_duplicado: isCpfDup,
          token: token ?? '',
          cliente_id: sgpClienteId,
          ...body,
        }),
      },
      8000
    )
    const fluenzoResponse = await fluenzoRes.json()
    if (dbLeadId) {
      await pool.query(
        `UPDATE leads SET fluenzo_status = 'enviado', fluenzo_response = $1 WHERE id = $2`,
        [JSON.stringify(fluenzoResponse), dbLeadId]
      )
    }
  } catch (err) {
    console.error('[FLUENZO ERROR]', err)
    if (dbLeadId) {
      await pool.query(
        `UPDATE leads SET fluenzo_status = 'erro', fluenzo_response = $1 WHERE id = $2`,
        [JSON.stringify({ error: String(err) }), dbLeadId]
      )
    }
  }

  // ── 5. E-mail atendimento ──────────────────────────────────────────────────
  // O e-mail sai ~30s após o submit em todas as situações; o título carrega
  // CPF/CNPJ, duplicidade e o status real de otp_verificado no banco.
  const sendAtendimentoEmail = async (emailConfirmado: boolean) => {
    try {
      const now = new Date()
      const timestamp = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
      const velocidade = plano_velocidade?.match(/(\d+MB)/)?.[1] ?? ''
      const planoId = getPlanoId(cidade_cobertura, bairro_cobertura, velocidade)
      const { pop_id, portador_id } = getPopPortador(cidade_cobertura, bairro_cobertura)

      const origemLabel = origem ?? 'web'
      const docTipo = tipoPessoa === 'J' ? 'CNPJ' : 'CPF'
      const docLabel = isCpfDup ? `${docTipo} Duplicado` : docTipo
      // Atendimento não passa por OTP — nunca sinaliza. Web sem OTP: "OTP = False" ao fim.
      const otpFlag = origem !== 'atendimento' && !emailConfirmado ? ' - OTP = False' : ''
      const mgmTag = isMgm ? ' #amigodefibra' : ''
      const subject = `Novo Cadastro${mgmTag} - ${docLabel} - ${nome} - ${origemLabel}${otpFlag}`

      const txtContent = [
        `=== KN Internet — Lead #${dbLeadId} ===`,
        `Data/hora: ${timestamp}`,
        `Lead ID: ${dbLeadId ?? '—'}`,
        `Origem: ${origem ?? 'web'}`,
        `CPF duplicado: ${isCpfDup ? 'Sim' : 'Não'}`,
        `E-mail confirmado (OTP): ${emailConfirmado ? 'Sim' : 'Não'}`,
        ``,
        `--- DADOS PESSOAIS ---`,
        `Nome: ${nome}`,
        `CPF/CNPJ: ${cpfcnpj}`,
        `E-mail: ${email}`,
        `WhatsApp: ${celular}`,
        ``,
        `--- PLANO ---`,
        `Cidade cobertura: ${cidade_cobertura}`,
        `Bairro cobertura: ${bairro_cobertura}`,
        `Plano: ${plano_velocidade} - ${plano_preco}`,
        `Vencimento: Dia ${vencimento}`,
        `Taxa de instalação: R$ 150,00 via Pix`,
        `POP ID: ${pop_id}`,
        `Portador ID: ${portador_id}`,
        `Plano ID SGP: ${planoId}`,
        ``,
        `--- ENDEREÇO DE INSTALAÇÃO ---`,
        `Logradouro: ${logradouro}, ${numero}${complemento ? ` - ${complemento}` : ''}`,
        `Bairro: ${bairro}`,
        `Cidade/UF: ${cidade} - ${uf}`,
        `CEP: ${cep}`,
        `Referência: ${isMgm && indicador_nome ? `INDICAÇÃO AMIGO DE FIBRA - indicado por ${indicador_primeiro_nome || indicador_nome} (${indicador_cpf || indicador_valor || 'nome'}) - lead #${dbLeadId}` : 'suprimido'}`,
        ...(isMgm ? [
          ``,
          `--- INDICAÇÃO (AMIGO DE FIBRA) ---`,
          `Indicador: ${indicador_nome || '—'}`,
          `Tipo identificação: ${indicador_tipo || '—'}`,
          `Valor informado: ${indicador_valor || '—'}`,
          `CPF indicador: ${indicador_cpf || '—'}`,
          `Cliente ID indicador: ${indicador_cliente_id || '—'}`,
          `Validado (quiz): ${indicador_validado ? 'Sim' : 'Não'}`,
        ] : []),
        ``,
        `--- RASTREAMENTO ---`,
        `SGP Cliente ID: ${sgpClienteId ?? '—'}`,
        `Session ID: ${session_id ?? '—'}`,
        `GA4 Client ID: ${ga_client_id ?? '—'}`,
      ].join('\n')

      await mailer.sendMail({
        from: `"KN Internet - Base" <${process.env.SMTP_USER}>`,
        to: process.env.SMTP_USER,
        cc: 'dev@kninternet.com.br',
        subject,
        html: `
          <h2>Novo cadastro recebido</h2>
          <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
            <tr><td><b>Nome</b></td><td>${nome}</td></tr>
            <tr><td><b>CPF/CNPJ</b></td><td>${cpfcnpj}</td></tr>
            <tr><td><b>E-mail</b></td><td>${email}</td></tr>
            <tr><td><b>E-mail confirmado</b></td><td>${emailConfirmado ? 'Sim ✓' : 'NÃO'}</td></tr>
            <tr><td><b>WhatsApp</b></td><td>${celular}</td></tr>
            <tr><td><b>Plano</b></td><td>${plano_velocidade} — ${plano_preco}</td></tr>
            <tr><td><b>Bairro cobertura</b></td><td>${bairro_cobertura}</td></tr>
            <tr><td><b>Cidade cobertura</b></td><td>${cidade_cobertura}</td></tr>
            <tr><td><b>Vencimento</b></td><td>Dia ${vencimento}</td></tr>
            <tr><td><b>SGP Cliente ID</b></td><td>${sgpClienteId ?? '—'}</td></tr>
            <tr><td><b>SGP Status</b></td><td>${isCpfDup ? 'CPF duplicado' : sgpOk ? 'Cadastrado' : sgpMessage}</td></tr>
            <tr><td><b>Origem</b></td><td>${origemLabel}</td></tr>
            ${isMgm ? `
            <tr><td colspan="2" style="padding-top:12px"><b>🤝 INDICAÇÃO — AMIGO DE FIBRA</b></td></tr>
            <tr><td><b>Indicador</b></td><td>${indicador_nome || '—'}</td></tr>
            <tr><td><b>Tipo</b></td><td>${indicador_tipo || '—'}</td></tr>
            <tr><td><b>CPF indicador</b></td><td>${indicador_cpf || '—'}</td></tr>
            <tr><td><b>Validado (quiz)</b></td><td>${indicador_validado ? 'Sim ✓' : 'Não'}</td></tr>
            ` : ''}
            <tr><td><b>Lead ID</b></td><td>#${dbLeadId}</td></tr>
          </table>
        `,
        attachments: [
          {
            filename: `lead-${dbLeadId}-${nome.replace(/\s+/g, '-').toLowerCase()}.txt`,
            content: txtContent,
            contentType: 'text/plain; charset=utf-8',
          },
        ],
      })
    } catch (err) {
      console.error('[MAIL ERROR]', err)
    }
  }

  // Janela única de 30s para todas as situações (web, atendimento, duplicados):
  // consulta otp_verificado no banco e monta o título com o status real do e-mail.
  setTimeout(async () => {
    let confirmado = false
    try {
      if (dbLeadId) {
        const { rows } = await pool.query(
          `SELECT otp_verificado FROM leads WHERE id = $1`,
          [dbLeadId]
        )
        confirmado = rows[0]?.otp_verificado === true
      }
    } catch (err) {
      console.error('[OTP CHECK ERROR]', err)
    }
    await sendAtendimentoEmail(confirmado)
  }, 30_000)

  // ── 5b. E-mail cliente (apenas quando origem = atendimento) ────────────────
  if (origem === 'atendimento' && email && !isCpfDup) {
    try {
      await mailer.sendMail({
        from: `"KN Internet" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${nome.split(' ')[0]}, seu cadastro KN Internet foi recebido!`,
        html: buildEmailClienteHtml({
          nome,
          plano_velocidade,
          plano_preco,
          vencimento,
          cidade_cobertura,
          bairro_cobertura,
        }),
      })
    } catch (err) {
      console.error('[MAIL CLIENTE ERROR]', err)
    }
  }

  // ── 6. Meta CAPI ───────────────────────────────────────────────────────────
  const nomeParts = nome.trim().split(' ')
  const eventId = `kn_submit_${dbLeadId ?? session_id ?? Date.now()}`

  void sendCAPIEvent({
    eventName: 'CompleteRegistration',
    eventId,
    userData: {
      email,
      phone: `55${celular.replace(/\D/g, '')}`,
      firstName: nomeParts[0],
      lastName: nomeParts.length > 1 ? nomeParts[nomeParts.length - 1] : undefined,
      city: cidade_cobertura || cidade,
      state: uf,
      zipCode: cep,
      country: 'br',
      clientIpAddress: client_ip_address,
      clientUserAgent: client_user_agent,
      fbp,
    },
    customData: {
      contentName: `${plano_velocidade} — ${plano_preco}`,
      contentCategory: `${cidade_cobertura} – ${bairro_cobertura}`,
      value: planoValor,
      currency: 'BRL',
      status: isCpfDup ? 'pending' : sgpOk ? 'success' : 'pending',
    },
  })

  // ── 7. GA4 ─────────────────────────────────────────────────────────────────
  void sendGA4Event({
    clientId: ga_client_id ?? session_id ?? String(dbLeadId),
    eventName: 'conversion',
    params: {
      lead_id: dbLeadId ?? 0,
      kn_plano: plano_velocidade,
      kn_cidade: cidade_cobertura,
      kn_bairro: bairro_cobertura,
      sgp_status: isCpfDup ? 'cpf_duplicado' : sgpOk ? 'enviado' : 'erro',
      value: planoValor,
      currency: 'BRL',
    },
  })

  return NextResponse.json({ status: 'success', cliente_id: sgpClienteId })
}