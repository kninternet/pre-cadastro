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
    session_id, nome, email, whatsapp,
    client_ip_address, client_user_agent, fbp, ga_client_id,
  } = body

  if (!session_id || !nome || !email || !whatsapp) {
    return NextResponse.json({ status: 'error', message: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  // ── 1. Banco ────────────────────────────────────────────────────────────────
  let leadId: number | null = null
  try {
    const { rows } = await pool.query(
      `INSERT INTO leads (
        session_id,
        nome, email, whatsapp,
        step_atual
      ) VALUES ($1,$2,$3,$4,$5)
      RETURNING id`,
      [
        session_id,
        nome.trim(),
        email.trim().toLowerCase(),
        whatsapp.replace(/\D/g, ''),
        1,
      ]
    )
    leadId = rows[0].id
  } catch (err) {
    console.error('[STEP1 DB ERROR]', err)
    return NextResponse.json({ status: 'error', message: 'Erro ao salvar Step 1' }, { status: 500 })
  }

  const eventId = `kn_step1_${session_id}`
  const nomeParts = nome.trim().split(' ')

  // ── 2. Meta CAPI — Lead ────────────────────────────────────────────────────
  void sendCAPIEvent({
    eventName: 'Lead',
    eventId,
    userData: {
      email: email.trim().toLowerCase(),
      phone: `55${whatsapp.replace(/\D/g, '')}`,
      firstName: nomeParts[0],
      lastName: nomeParts.length > 1 ? nomeParts[nomeParts.length - 1] : undefined,
      country: 'br',
      clientIpAddress: client_ip_address,
      clientUserAgent: client_user_agent,
      fbp,
    },
  })

  // ── 3. GA4 — generate_lead ─────────────────────────────────────────────────
  void sendGA4Event({
    clientId: ga_client_id ?? session_id,
    eventName: 'generate_lead',
    params: {
      lead_id: leadId ?? 0,
    },
  })

  return NextResponse.json({ status: 'success', lead_id: leadId })
}
