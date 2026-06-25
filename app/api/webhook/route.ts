import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import nodemailer from 'nodemailer'
import { getPopPortador, getPlanoId, DATA } from '@/lib/data'
import { buildEmailClienteHtml } from '@/lib/email-cliente'

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

async function checkCpfSgp(cpf: string): Promise<{ found: boolean; cliente_id?: number }> {
  try {
    const base = process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'
    const app = process.env.SGP_APP ?? ''
    const token = process.env.SGP_TOKEN ?? ''

    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)

    const cmd = `curl -s -X GET '${base}/api/crm/cliente/?cpfcnpj=${cpf}' --form 'app="${app}"' --form 'token="${token}"'`
    const { stdout } = await execAsync(cmd)
    const data = JSON.parse(stdout)
    if (data?.id) return { found: true, cliente_id: data.id as number }
    return { found: false }
  } catch {
    return { found: false }
  }
}

export async function POST(request: Request) {
  // ── Autenticação via Bearer token ──────────────────────────────────────────
  const authHeader = request.headers.get('authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET ?? ''
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ status: 'error', message: 'Não autorizado' }, { status: 401 })
  }

  let body: Record<string, string>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', message: 'Payload inválido' }, { status: 400 })
  }

  const {
    origem, nome, celular, email, cpf,
    cidade, bairro, plano, vencimento,
    cep, logradouro, numero, complemento,
  } = body

  // ── Validação básica ───────────────────────────────────────────────────────
  const required = { origem, nome, celular, email, cpf, cidade, bairro, plano, vencimento, cep, logradouro, numero }
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k)
  if (missing.length > 0) {
    return NextResponse.json({
      status: 'error',
      message: `Campos obrigatórios ausentes: ${missing.join(', ')}`,
    }, { status: 400 })
  }

  const cpfLimpo = cpf.replace(/\D/g, '')
  if (cpfLimpo.length !== 11) {
    return NextResponse.json({ status: 'error', message: 'CPF inválido' }, { status: 400 })
  }

  // ── 1. Consulta CPF no SGP ─────────────────────────────────────────────────
  const cpfCheck = await checkCpfSgp(cpfLimpo)
  if (cpfCheck.found) {
    // Grava no banco com cpf_duplicado
    try {
      await pool.query(
        `INSERT INTO leads (nome, email, whatsapp, cpf, cidade_cobertura, bairro_cobertura,
          plano_velocidade, vencimento, cep, logradouro, bairro_endereco, cidade_endereco,
          sgp_status, sgp_response, origem, session_id, step_atual)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [
          nome, email, celular.replace(/\D/g, ''), cpfLimpo,
          cidade, bairro, plano, vencimento,
          cep.replace(/\D/g, ''), logradouro, bairro, cidade,
          'cpf_duplicado',
          JSON.stringify({ message: 'CPF já cadastrado na base KN Internet', cliente_id: null }),
          origem, `webhook-${Date.now()}`, 3,
        ]
      )
    } catch (err) {
      console.error('[WEBHOOK DB ERROR]', err)
    }

    return NextResponse.json({
      status: 'cpf_duplicado',
      cpf_status: 'duplicado',
      cliente_id: null,
      lead_id: null,
      message: 'CPF já cadastrado na base KN Internet',
    })
  }

  // ── 2. Grava lead no banco ─────────────────────────────────────────────────
  let dbLeadId: number | null = null
  try {
    const result = await pool.query(
      `INSERT INTO leads (nome, email, whatsapp, cpf, cidade_cobertura, bairro_cobertura,
        plano_velocidade, vencimento, cep, logradouro, bairro_endereco, cidade_endereco,
        sgp_status, origem, session_id, step_atual)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING id`,
      [
        nome, email, celular.replace(/\D/g, ''), cpfLimpo,
        cidade, bairro, plano, vencimento,
        cep.replace(/\D/g, ''), logradouro, bairro, cidade,
        'pendente', origem, `webhook-${Date.now()}`, 3,
      ]
    )
    dbLeadId = result.rows[0]?.id ?? null
  } catch (err) {
    console.error('[WEBHOOK DB INSERT ERROR]', err)
  }

  // ── 3. SGP CRM — criar cliente ─────────────────────────────────────────────
  let sgpOk = false
  let sgpClienteId: number | null = null
  let sgpMessage = 'Erro no cadastro'

  const enderecoSgp = {
    logradouro, numero: numero ?? 'S/N',
    complemento: complemento ?? '',
    bairro, cidade,
    cep: cep.replace(/\D/g, ''),
    uf: 'RJ', pais: 'BR', pontoreferencia: 'suprimido',
  }

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
          celular: celular.replace(/\D/g, '').replace(/^55(\d{9,11})$/, '$1').replace(/^(\d{2})(\d{8})$/, '$19$2'),
          endereco: enderecoSgp,
        }),
      },
      8000
    )
    const sgpData = await sgpRes.json() as Record<string, unknown>
    console.log('[WEBHOOK SGP RESPONSE]', JSON.stringify(sgpData))

    if (sgpData.cliente_id) {
      sgpClienteId = sgpData.cliente_id as number
      sgpOk = true
      sgpMessage = 'Cliente criado com sucesso'
    } else {
      sgpMessage = String(
        (sgpData.errors as Record<string, string>)?.cpfcnpj ??
        sgpData.message ?? 'Erro no cadastro'
      )
      console.error('[WEBHOOK SGP ERROR]', JSON.stringify(sgpData))
    }
  } catch (err: unknown) {
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    sgpMessage = isTimeout ? 'Timeout SGP' : 'Erro no cadastro'
    console.error('[WEBHOOK SGP EXCEPTION]', err)
  }

  // ── 4. Atualiza banco ──────────────────────────────────────────────────────
  if (dbLeadId) {
    try {
      await pool.query(
        `UPDATE leads SET sgp_status = $1, sgp_response = $2 WHERE id = $3`,
        [
          sgpOk ? 'enviado' : 'erro',
          JSON.stringify({ message: sgpMessage, cliente_id: sgpClienteId }),
          dbLeadId,
        ]
      )
    } catch (err) {
      console.error('[WEBHOOK DB UPDATE ERROR]', err)
    }
  }

  // ── 5. E-mail atendimento ──────────────────────────────────────────────────
  try {
    const velocidade = plano?.match(/(\d+MB)/)?.[1] ?? ''
    const { pop_id, portador_id } = getPopPortador(cidade, bairro)
    const planoId = getPlanoId(cidade, bairro, velocidade)
    const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    const txtContent = [
      `=== KN Internet — Lead #${dbLeadId} ===`,
      `Data/hora: ${timestamp}`,
      `Lead ID: ${dbLeadId ?? '—'}`,
      `Origem: ${origem}`,
      `CPF duplicado: Não`,
      ``,
      `--- DADOS PESSOAIS ---`,
      `Nome: ${nome}`,
      `CPF: ${cpf}`,
      `E-mail: ${email}`,
      `WhatsApp: ${celular}`,
      ``,
      `--- PLANO ---`,
      `Cidade cobertura: ${cidade}`,
      `Bairro cobertura: ${bairro}`,
      `Plano: ${plano}`,
      `Vencimento: Dia ${vencimento}`,
      `Taxa de instalação: R$ 150,00 via Pix`,
      `POP ID: ${pop_id}`,
      `Portador ID: ${portador_id}`,
      `Plano ID SGP: ${planoId}`,
      ``,
      `--- ENDEREÇO ---`,
      `Logradouro: ${logradouro}, ${numero}${complemento ? ` - ${complemento}` : ''}`,
      `CEP: ${cep}`,
      ``,
      `--- RASTREAMENTO ---`,
      `SGP Cliente ID: ${sgpClienteId ?? '—'}`,
    ].join('\n')

    await mailer.sendMail({
      from: `"KN Internet - Base" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `[${origem.toUpperCase()}] Novo cadastro — ${nome}`,
      html: `
        <h2>Novo cadastro via ${origem}</h2>
        <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
          <tr><td><b>Nome</b></td><td>${nome}</td></tr>
          <tr><td><b>CPF</b></td><td>${cpf}</td></tr>
          <tr><td><b>E-mail</b></td><td>${email}</td></tr>
          <tr><td><b>WhatsApp</b></td><td>${celular}</td></tr>
          <tr><td><b>Plano</b></td><td>${plano}</td></tr>
          <tr><td><b>Bairro cobertura</b></td><td>${bairro}</td></tr>
          <tr><td><b>Cidade cobertura</b></td><td>${cidade}</td></tr>
          <tr><td><b>Vencimento</b></td><td>Dia ${vencimento}</td></tr>
          <tr><td><b>SGP Cliente ID</b></td><td>${sgpClienteId ?? '—'}</td></tr>
          <tr><td><b>Lead ID</b></td><td>#${dbLeadId}</td></tr>
          <tr><td><b>Origem</b></td><td>${origem}</td></tr>
        </table>
      `,
      attachments: [{
        filename: `lead-${dbLeadId}-${nome.replace(/\s+/g, '-').toLowerCase()}.txt`,
        content: txtContent,
        contentType: 'text/plain; charset=utf-8',
      }],
    })
  } catch (err) {
    console.error('[WEBHOOK MAIL ERROR]', err)
  }

  // ── 6. E-mail cliente ──────────────────────────────────────────────────────
  if (email && sgpOk) {
    try {
      const planoParts = DATA[cidade]?.bairros[bairro]?.find(p => p.v === plano)
      const plano_preco = planoParts?.p ?? ''

      await mailer.sendMail({
        from: `"KN Internet" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${nome.split(' ')[0]}, seu cadastro KN Internet foi recebido!`,
        html: buildEmailClienteHtml({
          nome,
          plano_velocidade: plano,
          plano_preco,
          vencimento,
          cidade_cobertura: cidade,
          bairro_cobertura: bairro,
        }),
      })
    } catch (err) {
      console.error('[WEBHOOK MAIL CLIENTE ERROR]', err)
    }
  }

  // ── Response para o JetChat ────────────────────────────────────────────────
  return NextResponse.json({
    status: sgpOk ? 'success' : 'error',
    cpf_status: 'disponivel',
    cliente_id: sgpClienteId,
    lead_id: dbLeadId,
    message: sgpMessage,
  })
}
