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
    session_id, cidade, bairro, plano, vencimento, aceita_taxa_instalacao,
    // Contexto do navegador — enviados pelo frontend para enriquecer o CAPI
    client_ip_address, client_user_agent, fbp, ga_client_id,
  } = body

  if (!session_id || !cidade || !bairro || !plano || !vencimento || aceita_taxa_instalacao === undefined) {
    return NextResponse.json({ status: 'error', message: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const [plano_velocidade, plano_preco] = plano.split(' - ').map((s: string) => s.trim())

  // ── 1. Banco ────────────────────────────────────────────────────────────────
  let leadId: number | null = null
  try {
    const { rows } = await pool.query(
      `INSERT INTO leads (
        session_id,
        cidade_cobertura, bairro_cobertura,
        plano_velocidade, plano_preco,
        vencimento, aceita_taxa_instalacao,
        step_atual
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id`,
      [
        session_id,
        cidade, bairro,
        plano_velocidade, plano_preco ?? '',
        vencimento, aceita_taxa_instalacao === 'true' || aceita_taxa_instalacao === true,
        1,
      ]
    )
    leadId = rows[0].id
  } catch (err) {
    console.error('[STEP1 DB ERROR]', err)
    return NextResponse.json({ status: 'error', message: 'Erro ao salvar Step 1' }, { status: 500 })
  }

  // event_id único para deduplicação com o pixel client-side
  const eventId = `kn_step1_${session_id}`

  // ── 2. Meta CAPI — InitiateCheckout ────────────────────────────────────────
  // Neste step ainda não temos dados pessoais — enviamos apenas contexto de
  // navegador e dados do plano escolhido
  void sendCAPIEvent({
    eventName: 'InitiateCheckout',
    eventId,
    userData: {
      clientIpAddress: client_ip_address,
      clientUserAgent: client_user_agent,
      fbp,
    },
    customData: {
      contentName:     plano,
      contentCategory: `${cidade} – ${bairro}`,
    },
  })

  // ── 3. GA4 Measurement Protocol — begin_checkout ───────────────────────────
  void sendGA4Event({
    clientId: ga_client_id ?? session_id,
    eventName: 'begin_checkout',
    params: {
      kn_cidade:  cidade,
      kn_bairro:  bairro,
      kn_plano:   plano,
      lead_id:    leadId ?? 0,
    },
  })

  return NextResponse.json({ status: 'success', lead_id: leadId })
}
