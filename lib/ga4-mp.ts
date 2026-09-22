/**
 * ga4-mp.ts — KN Internet
 *
 * Envia eventos server-side para o GA4 via Measurement Protocol.
 * Complementa o que o GTM/gtag já envia client-side — garante
 * conversões mesmo com bloqueadores de JS ou saída antecipada.
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface GA4EventParams {
  clientId: string           // _ga cookie ou fallback gerado no frontend
  sessionId?: string         // _ga_<ID> cookie — ancora o evento na sessão real do navegador
  eventName: string          // ex: 'generate_lead', 'begin_checkout'
  params?: Record<string, string | number | boolean>
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function sendGA4Event(event: GA4EventParams): Promise<void> {
  const measurementId = process.env.GA4_MEASUREMENT_ID
  const apiSecret     = process.env.GA4_API_SECRET

  if (!measurementId || !apiSecret) {
    console.warn('[GA4 MP] GA4_MEASUREMENT_ID ou GA4_API_SECRET não configurados')
    return
  }

  const payload = {
    client_id: event.clientId,
    events: [
      {
        name:   event.eventName,
        params: {
          engagement_time_msec: 1,
          // Usa o session_id real da sessão do navegador quando disponível.
          // Sem isso, o GA4 cria uma sessão nova sem contexto de UTM/página (bug corrigido em set/2026).
          session_id: event.sessionId ?? Date.now().toString(),
          ...event.params,
        },
      },
    ],
  }

  try {
    const res = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }
    )

    // GA4 MP retorna 204 em sucesso — sem body
    if (res.ok) {
      console.log(`[GA4 MP] ${event.eventName} enviado — client_id: ${event.clientId} — session_id: ${event.sessionId ?? '(fallback)'}`)
    } else {
      console.error('[GA4 MP ERROR]', res.status, await res.text())
    }
  } catch (err) {
    // GA4 MP nunca derruba o fluxo principal
    console.error('[GA4 MP EXCEPTION]', err)
  }
}
