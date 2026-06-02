import { NextResponse } from 'next/server'
import { Pool } from 'pg'
import { sendCAPIEvent } from '@/lib/meta-capi'
import { sendGA4Event } from '@/lib/ga4-mp'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: Request) {
  let body: Record<string, string>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', message: 'Payload inválido' }, { status: 400 })
  }

  const {
    lead_id, nome, cpf, email, whatsapp, telefone_fixo, telefone_residencial,
    // Contexto do navegador
    client_ip_address, client_user_agent, fbp, ga_client_id, session_id,
  } = body

  if (!lead_id || !nome || !cpf || !email || !whatsapp) {
    return NextResponse.json({ status: 'error', message: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  // ── 1. Banco ────────────────────────────────────────────────────────────────
  try {
    await pool.query(
      `UPDATE leads SET
        nome = $1,
        cpf = $2,
        email = $3,
        whatsapp = $4,
        telefone_fixo = $5,
        telefone_residencial = $6,
        step_atual = 2
      WHERE id = $7`,
      [
        nome,
        cpf.replace(/\D/g, ''),
        email,
        whatsapp.replace(/\D/g, ''),
        telefone_fixo ?? null,
        telefone_residencial ?? null,
        parseInt(lead_id),
      ]
    )
  } catch (err) {
    console.error('[STEP2 DB ERROR]', err)
    return NextResponse.json({ status: 'error', message: 'Erro ao salvar Step 2' }, { status: 500 })
  }

  // event_id único — mesmo ID deve ser enviado pelo pixel client-side no trackStep2Next()
  const eventId = `kn_step2_${lead_id}`

  // Normaliza nome para primeiro e último
  const nomeParts  = nome.trim().split(' ')
  const firstName  = nomeParts[0]
  const lastName   = nomeParts.length > 1 ? nomeParts[nomeParts.length - 1] : undefined

  // ── 2. Meta CAPI — Lead ────────────────────────────────────────────────────
  // Aqui temos email + telefone — maior match rate com a base Meta
  void sendCAPIEvent({
    eventName: 'Lead',
    eventId,
    userData: {
      email,
      phone:           `55${whatsapp.replace(/\D/g, '')}`,   // DDI Brasil
      firstName,
      lastName,
      country:         'br',
      clientIpAddress: client_ip_address,
      clientUserAgent: client_user_agent,
      fbp,
    },
  })

  // ── 3. GA4 Measurement Protocol — generate_lead ────────────────────────────
  void sendGA4Event({
    clientId: ga_client_id ?? session_id ?? lead_id,
    eventName: 'generate_lead',
    params: {
      lead_id: parseInt(lead_id),
    },
  })

  return NextResponse.json({ status: 'success' })
}
