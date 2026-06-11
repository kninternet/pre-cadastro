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
    lead_id, cpf, cidade, bairro, plano, vencimento, aceita_taxa_instalacao,
    client_ip_address, client_user_agent, fbp, ga_client_id, session_id,
  } = body

  if (!lead_id || !cpf || !cidade || !bairro || !plano || !vencimento) {
    return NextResponse.json({ status: 'error', message: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const [plano_velocidade, plano_preco] = plano.split(' - ').map((s: string) => s.trim())

  // ── 1. Banco ────────────────────────────────────────────────────────────────
  try {
    await pool.query(
      `UPDATE leads SET
        cpf = $1,
        cidade_cobertura = $2,
        bairro_cobertura = $3,
        plano_velocidade = $4,
        plano_preco = $5,
        vencimento = $6,
        aceita_taxa_instalacao = $7,
        step_atual = 2
      WHERE id = $8`,
      [
        cpf.replace(/\D/g, ''),
        cidade,
        bairro,
        plano_velocidade,
        plano_preco ?? '',
        vencimento,
        aceita_taxa_instalacao === 'true' || aceita_taxa_instalacao === true,
        parseInt(lead_id),
      ]
    )
  } catch (err) {
    console.error('[STEP2 DB ERROR]', err)
    return NextResponse.json({ status: 'error', message: 'Erro ao salvar Step 2' }, { status: 500 })
  }

  const eventId = `kn_step2_${lead_id}`

  // ── 2. Meta CAPI — InitiateCheckout ───────────────────────────────────────
  void sendCAPIEvent({
    eventName: 'InitiateCheckout',
    eventId,
    userData: {
      clientIpAddress: client_ip_address,
      clientUserAgent: client_user_agent,
      fbp,
    },
    customData: {
      contentName: plano,
      contentCategory: `${cidade} – ${bairro}`,
    },
  })

  // ── 3. GA4 — begin_checkout ────────────────────────────────────────────────
  void sendGA4Event({
    clientId: ga_client_id ?? session_id ?? lead_id,
    eventName: 'begin_checkout',
    params: {
      lead_id: parseInt(lead_id),
      kn_cidade: cidade,
      kn_bairro: bairro,
      kn_plano: plano,
    },
  })

  return NextResponse.json({ status: 'success' })
}
