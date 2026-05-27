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
    lead_id,
    nome, cpfcnpj, email, celular,
    logradouro: logradouroRaw,
    bairro, cidade, uf, cep,
    pontoreferencia, observacao,
    token,
  } = body

  const { logradouro, numero, complemento } = parseLogradouro(logradouroRaw ?? '')
  const vencimento = observacao?.match(/Vencimento:\s*Dia\s*(\S+)/)?.[1] ?? ''
  const cidade_cobertura = observacao?.match(/Cidade cobertura:\s*(.+)/)?.[1]?.trim() ?? ''
  const plano_velocidade = observacao?.match(/Plano:\s*(.+?)\s*-/)?.[1]?.trim() ?? ''
  const plano_preco = observacao?.match(/-\s*(.+?)\s*\|/)?.[1]?.trim() ?? ''

  // ── 1. Atualizar banco com endereço e step_atual = 3 ─────────────────────
  const dbLeadId = lead_id ? parseInt(lead_id) : null

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
          pontoreferencia, dbLeadId,
        ]
      )
    } catch (err) {
      console.error('[STEP3 DB ERROR]', err)
    }
  } else {
    // fallback: lead chegou direto no submit sem passar pelos steps
    try {
      await pool.query(
        `INSERT INTO leads (
          cidade_cobertura, bairro_cobertura, plano_velocidade, plano_preco,
          vencimento, aceita_taxa_instalacao,
          nome, cpf, email, whatsapp,
          cep, logradouro, numero, complemento,
          bairro_endereco, cidade_endereco, estado, ponto_referencia,
          otp_verificado, step_atual
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
        [
          cidade_cobertura, bairro, plano_velocidade, plano_preco,
          vencimento, true,
          nome, cpfcnpj, email, celular,
          cep.replace(/\D/g, ''), logradouro, numero, complemento ?? null,
          bairro, cidade, uf, pontoreferencia,
          false, 3,
        ]
      )
    } catch (err) {
      console.error('[FALLBACK DB ERROR]', err)
    }
  }

  // ── 2. Chamar SGP ─────────────────────────────────────────────────────────
  let sgpOk = false
  let sgpResponse: unknown = null
  let sgpMessage = 'Erro no cadastro'

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
    const sgpData = sgpResponse as Record<string, string>

    if (sgpData.message === 'Pre-cadastro criado com sucesso') {
      sgpOk = true
      sgpMessage = 'Realizado com sucesso'
    } else if (sgpData.error?.includes('CPF') || sgpData.message?.includes('CPF')) {
      sgpMessage = 'CPF já cadastrado'
    } else {
      sgpMessage = sgpData.error ?? sgpData.message ?? 'Erro no cadastro'
    }

    if (dbLeadId) {
      await pool.query(
        `UPDATE leads SET sgp_status = $1, sgp_response = $2 WHERE id = $3`,
        [sgpOk ? 'enviado' : 'erro', JSON.stringify(sgpResponse), dbLeadId]
      )
    }
  } catch (err) {
    console.error('[SGP ERROR]', err)
    if (dbLeadId) {
      await pool.query(
        `UPDATE leads SET sgp_status = 'erro', sgp_response = $1 WHERE id = $2`,
        [JSON.stringify({ error: String(err) }), dbLeadId]
      )
    }
  }

  // ── 3. Notificar Fluenzo ──────────────────────────────────────────────────
  try {
    const fluenzoCallback = {
      status: sgpOk,
      message: sgpMessage,
      token: token ?? '',
      ...body,
    }
    const fluenzoRes = await fetch(process.env.FLUENZO_URL ?? '', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fluenzoCallback),
    })
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

  // ── 4. E-mail para atendimento ────────────────────────────────────────────
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
          <tr><td><b>Plano</b></td><td>${plano_velocidade} — ${plano_preco}</td></tr>
          <tr><td><b>Bairro cobertura</b></td><td>${bairro}</td></tr>
          <tr><td><b>Cidade cobertura</b></td><td>${cidade_cobertura}</td></tr>
          <tr><td><b>Vencimento</b></td><td>Dia ${vencimento}</td></tr>
          <tr><td><b>SGP</b></td><td>${sgpOk ? '✅ Enviado' : '⚠️ ' + sgpMessage}</td></tr>
          <tr><td><b>Lead ID</b></td><td>#${dbLeadId}</td></tr>
        </table>
      `,
    })
  } catch (err) {
    console.error('[MAIL ERROR]', err)
  }

  // ── Resposta final ────────────────────────────────────────────────────────
  if (sgpOk) {
    return NextResponse.json({ status: 'success' })
  }

  if (sgpMessage === 'CPF já cadastrado') {
    return NextResponse.json({ status: 'erro cpf ja cadastrado' })
  }

  return NextResponse.json({ status: 'success' })
}
