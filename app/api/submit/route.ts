import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import nodemailer from 'nodemailer'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const mailer = nodemailer.createTransport({
  host: 'smtp.hostinger.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function parsePlano(plano: string) {
  const parts = plano.split(' - ')
  return {
    velocidade: parts[0]?.trim() ?? plano,
    preco: parts[1]?.trim() ?? '',
  }
}

function parseLogradouro(logradouro: string) {
  const match = logradouro.match(/^(.+?),\s*(\S+)(?:\s*-\s*(.+))?$/)
  if (match) {
    return {
      logradouro: match[1].trim(),
      numero: match[2].trim(),
      complemento: match[3]?.trim() ?? null,
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
    nome, cpfcnpj, email, celular,
    logradouro: logradouroRaw,
    bairro, cidade, uf, cep,
    pontoreferencia, observacao,
  } = body

  const { logradouro, numero, complemento } = parseLogradouro(logradouroRaw ?? '')
  const { velocidade, preco } = parsePlano(observacao?.match(/Plano:\s*(.+?)\s*\|/)?.[1] ?? '')
  const vencimento = observacao?.match(/Vencimento:\s*Dia\s*(\S+)/)?.[1] ?? ''
  const cidade_cobertura = observacao?.match(/Cidade cobertura:\s*(.+)/)?.[1]?.trim() ?? ''
  const bairro_cobertura = bairro ?? ''

  // 1. Gravar no banco
  let leadId: number
  try {
    const { rows } = await pool.query(
      `INSERT INTO leads (
        cidade_cobertura, bairro_cobertura, plano_velocidade, plano_preco,
        vencimento, aceita_taxa_instalacao,
        nome, cpf, email, whatsapp,
        cep, logradouro, numero, complemento,
        bairro_endereco, cidade_endereco, estado, ponto_referencia,
        otp_verificado
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19
      ) RETURNING id`,
      [
        cidade_cobertura, bairro_cobertura, velocidade, preco,
        vencimento, true,
        nome, cpfcnpj, email, celular,
        cep, logradouro, numero, complemento,
        bairro, cidade, uf, pontoreferencia,
        false,
      ]
    )
    leadId = rows[0].id
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('unique') || msg.includes('cpf')) {
      return NextResponse.json({ status: 'erro cpf ja cadastrado' })
    }
    console.error('[DB ERROR]', msg)
    return NextResponse.json({ status: 'error', message: 'Erro ao salvar cadastro' }, { status: 500 })
  }

  // 2. Chamar SGP
  let sgpOk = false
  let sgpResponse: unknown = null
  try {
    const sgpBody = new URLSearchParams({
      app: process.env.SGP_APP ?? '',
      token: process.env.SGP_TOKEN ?? '',
      nome, cpfcnpj, email,
      celular,
      logradouro, numero,
      ...(complemento ? { complemento } : {}),
      bairro, cidade, uf,
      cep: cep.replace(/\D/g, ''),
      pontoreferencia,
      pais: 'BR',
    })
    const sgpRes = await fetch(process.env.SGP_URL ?? '', {
      method: 'POST',
      body: sgpBody,
    })
    sgpResponse = await sgpRes.json()
    sgpOk = (sgpResponse as Record<string, string>).message === 'Pre-cadastro criado com sucesso'

    await pool.query(
      `UPDATE leads SET sgp_status = $1, sgp_response = $2 WHERE id = $3`,
      [sgpOk ? 'enviado' : 'erro', JSON.stringify(sgpResponse), leadId]
    )
  } catch (err) {
    console.error('[SGP ERROR]', err)
    await pool.query(
      `UPDATE leads SET sgp_status = 'erro', sgp_response = $1 WHERE id = $2`,
      [JSON.stringify({ error: String(err) }), leadId]
    )
  }

  // 3. Notificar Fluenzo
  try {
    const fluenzoRes = await fetch(process.env.FLUENZO_URL ?? '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const fluenzoResponse = await fluenzoRes.json()
    await pool.query(
      `UPDATE leads SET fluenzo_status = 'enviado', fluenzo_response = $1 WHERE id = $2`,
      [JSON.stringify(fluenzoResponse), leadId]
    )
  } catch (err) {
    console.error('[FLUENZO ERROR]', err)
    await pool.query(
      `UPDATE leads SET fluenzo_status = 'erro', fluenzo_response = $1 WHERE id = $2`,
      [JSON.stringify({ error: String(err) }), leadId]
    )
  }

  // 4. E-mail para atendimento
  try {
    await mailer.sendMail({
      from: `"KN Internet" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER,
      subject: `Novo pré-cadastro — ${nome}`,
      html: `
        <h2>Novo pré-cadastro recebido</h2>
        <table cellpadding="6" style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">
          <tr><td><b>Nome</b></td><td>${nome}</td></tr>
          <tr><td><b>CPF</b></td><td>${cpfcnpj}</td></tr>
          <tr><td><b>E-mail</b></td><td>${email}</td></tr>
          <tr><td><b>WhatsApp</b></td><td>${celular}</td></tr>
          <tr><td><b>Plano</b></td><td>${velocidade} — ${preco}</td></tr>
          <tr><td><b>Bairro cobertura</b></td><td>${bairro_cobertura}</td></tr>
          <tr><td><b>Cidade cobertura</b></td><td>${cidade_cobertura}</td></tr>
          <tr><td><b>Vencimento</b></td><td>Dia ${vencimento}</td></tr>
          <tr><td><b>SGP</b></td><td>${sgpOk ? '✅ Enviado' : '⚠️ Erro'}</td></tr>
          <tr><td><b>Lead ID</b></td><td>#${leadId}</td></tr>
        </table>
      `,
    })
  } catch (err) {
    console.error('[MAIL ERROR]', err)
  }

  // Resposta final
  if (sgpOk) {
    return NextResponse.json({ status: 'success' })
  }

  const sgpMsg = (sgpResponse as Record<string, string>)?.error ?? ''
  if (sgpMsg.includes('CPF')) {
    return NextResponse.json({ status: 'erro cpf ja cadastrado' })
  }

  return NextResponse.json({ status: 'success' })
}
