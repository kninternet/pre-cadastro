import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import nodemailer from 'nodemailer'
import { sendCAPIEvent } from '@/lib/meta-capi'
import { sendGA4Event } from '@/lib/ga4-mp'
import { getPopPortador, getPlanoId } from '@/lib/data'

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
  // Extrai apenas a parte numérica inicial: "203 casa B" → "203", "S/N" → "S/N"
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

function gerarSenha(cpf: string): string {
  return `${cpf.replace(/\D/g, '').slice(0, 6)}@Kn`
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
    pontoreferencia, observacao,
    token,
    cpf_duplicado,
    client_ip_address, client_user_agent, fbp, ga_client_id, session_id,
  } = body

  const { logradouro, numero, complemento } = parseLogradouro(logradouroRaw ?? '')
  const vencimento = observacao?.match(/Vencimento:\s*Dia\s*(\S+)/)?.[1] ?? ''
  const cidade_cobertura = observacao?.match(/Cidade cobertura:\s*(.+)/)?.[1]?.trim() ?? ''
  const bairro_cobertura = observacao?.match(/Bairro cobertura:\s*(.+)/)?.[1]?.trim() ?? ''
  const plano_velocidade = observacao?.match(/Plano:\s*(.+?)\s*-/)?.[1]?.trim() ?? ''
  const plano_preco = observacao?.match(/-\s*(.+?)\s*\|/)?.[1]?.trim() ?? ''
  const planoValor = parseFloat(plano_preco.replace(/[^\d,]/g, '').replace(',', '.') || '0')

  const dbLeadId = lead_id ? parseInt(lead_id) : null
  const cpfLimpo = cpfcnpj.replace(/\D/g, '')
  const isCpfDup = cpf_duplicado === 'true' || cpf_duplicado === true as unknown as string

  // ── 1. Banco — endereço (step 3) ────────────────────────────────────────────
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
          bairro, cidade, uf, pontoreferencia, dbLeadId,
        ]
      )
    } catch (err) {
      console.error('[STEP3 DB ERROR]', err)
    }
  }

  // ── 2. SGP CRM — pular se CPF duplicado ────────────────────────────────────
  let sgpOk = false
  let sgpClienteId: number | null = null
  let sgpMessage = isCpfDup ? 'CPF duplicado — encaminhado ao atendimento' : 'Erro no cadastro'

  const enderecoSgp = {
    logradouro, numero,
    complemento: complemento ?? '',
    bairro, cidade,
    cep: cep.replace(/\D/g, ''),
    uf, pais: 'BR', pontoreferencia,
  }

  if (!isCpfDup) {
    try {
      const sgpRes = await fetchWithTimeout(
        `${process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'}/api/crm/cliente/F`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            app: process.env.SGP_APP ?? '',
            token: process.env.SGP_TOKEN ?? '',
            nome,
            cpfcnpj: cpfLimpo,
            email,
            celular: celular.replace(/\D/g, '').replace(/^(\d{2})(\d{8})$/, '$19$2'),
            endereco: enderecoSgp,
          }),
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

    // ── 3. SGP CRM — Criar Contrato ───────────────────────────────────────────
    if (sgpOk && sgpClienteId) {
      const vencimentoDia = parseInt(vencimento) || 5
      const velocidade = plano_velocidade?.match(/(\d+MB)/)?.[1] ?? ''
      const planoId = getPlanoId(cidade_cobertura, bairro_cobertura, velocidade)
      const loginPppoe = cpfLimpo
      const senhaPppoe = gerarSenha(cpfLimpo)

      try {
        const contratoRes = await fetchWithTimeout(
          `${process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'}/api/crm/cliente/${sgpClienteId}/contratos`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              app: process.env.SGP_APP ?? '',
              token: process.env.SGP_TOKEN ?? '',
              contrato_id: parseInt(process.env.SGP_CONTRATO_ID ?? '3'),
              pop_id: getPopPortador(cidade_cobertura, bairro_cobertura).pop_id,
              plano_id: planoId,
              vencimento_dia: vencimentoDia,
              forma_cobranca_id: parseInt(process.env.SGP_FORMA_COBRANCA_ID ?? '3'),
              portador_id: getPopPortador(cidade_cobertura, bairro).portador_id,
              nas: process.env.SGP_NAS ?? 'RB_PEIXOTO_STA_CATARINA',
              modoaquisicao: 1,
              tipo_equipamento: process.env.SGP_TIPO_EQUIPAMENTO ?? 'teste',
              autocobranca: true,
              login: loginPppoe,
              senha: senhaPppoe,
              central_login: loginPppoe,
              central_senha: senhaPppoe,
              logins_simult: 1,
              os_instalacao: false,
              endereco_cobranca: enderecoSgp,
              endereco_instalacao: enderecoSgp,
            }),
          },
          8000
        )
        const contratoData = await contratoRes.json() as Record<string, unknown>
        console.log('[SGP CONTRATO RESPONSE]', JSON.stringify(contratoData))
        console.log('[SGP CONTRATO PARAMS] cidade:', cidade_cobertura, 'bairro:', bairro, 'vel:', velocidade, 'plano_id:', planoId)

        if (contratoData.clientecontrato) {
          sgpMessage = 'Cadastro realizado com sucesso'
        } else {
          sgpOk = false
          sgpMessage = String(contratoData.message ?? 'Erro ao criar contrato')
          console.error('[SGP CONTRATO ERROR]', JSON.stringify(contratoData))
        }
      } catch (err: unknown) {
        sgpOk = false
        const isTimeout = err instanceof Error && err.name === 'AbortError'
        sgpMessage = isTimeout ? 'Timeout SGP contrato' : 'Erro ao criar contrato'
        console.error('[SGP CONTRATO EXCEPTION]', err)
      }
    }
  }

  // ── 4. Atualiza banco ──────────────────────────────────────────────────────
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

  // ── 5. Fluenzo ─────────────────────────────────────────────────────────────
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

  // ── 6. E-mail atendimento ──────────────────────────────────────────────────
  try {
    await mailer.sendMail({
      from: `"KN Internet" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `${isCpfDup ? '⚠️ CPF DUPLICADO — ' : ''}Novo cadastro — ${nome}`,
      html: `
        <h2>${isCpfDup ? '⚠️ CPF Duplicado — Requer atenção do atendimento' : 'Novo cadastro recebido'}</h2>
        ${isCpfDup ? '<p style="color:#c0392b;font-weight:bold">Este CPF já existe na base do SGP. O cliente optou por continuar o cadastro. Verifique e tome a ação necessária.</p>' : ''}
        <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
          <tr><td><b>Nome</b></td><td>${nome}</td></tr>
          <tr><td><b>CPF</b></td><td>${cpfcnpj}</td></tr>
          <tr><td><b>E-mail</b></td><td>${email}</td></tr>
          <tr><td><b>WhatsApp</b></td><td>${celular}</td></tr>
          <tr><td><b>Plano</b></td><td>${plano_velocidade} — ${plano_preco}</td></tr>
          <tr><td><b>Bairro cobertura</b></td><td>${bairro}</td></tr>
          <tr><td><b>Cidade cobertura</b></td><td>${cidade_cobertura}</td></tr>
          <tr><td><b>Vencimento</b></td><td>Dia ${vencimento}</td></tr>
          <tr><td><b>SGP Cliente ID</b></td><td>${sgpClienteId ?? '—'}</td></tr>
          <tr><td><b>SGP Status</b></td><td>${isCpfDup ? '⚠️ CPF duplicado' : sgpOk ? '✅ Cadastrado' : '⚠️ ' + sgpMessage}</td></tr>
          <tr><td><b>Lead ID</b></td><td>#${dbLeadId}</td></tr>
        </table>
      `,
    })
  } catch (err) {
    console.error('[MAIL ERROR]', err)
  }

  // ── 7. Meta CAPI ───────────────────────────────────────────────────────────
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
      contentCategory: `${cidade_cobertura} – ${bairro}`,
      value: planoValor,
      currency: 'BRL',
      status: isCpfDup ? 'pending' : sgpOk ? 'success' : 'pending',
    },
  })

  // ── 8. GA4 ─────────────────────────────────────────────────────────────────
  void sendGA4Event({
    clientId: ga_client_id ?? session_id ?? String(dbLeadId),
    eventName: 'conversion',
    params: {
      lead_id: dbLeadId ?? 0,
      kn_plano: plano_velocidade,
      kn_cidade: cidade_cobertura,
      kn_bairro: bairro,
      sgp_status: isCpfDup ? 'cpf_duplicado' : sgpOk ? 'enviado' : 'erro',
      value: planoValor,
      currency: 'BRL',
    },
  })

  return NextResponse.json({ status: 'success', cliente_id: sgpClienteId })
}