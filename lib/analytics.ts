/**
 * analytics.ts — KN Internet
 *
 * Centraliza todos os disparos de eventos para:
 *   • GTM dataLayer  → GA4 + qualquer outra tag configurada no GTM
 *   • Meta Pixel fbq → Eventos padrão e customizados
 *
 * DEDUPLICAÇÃO META CAPI
 * Cada evento que tem um espelho server-side (CAPI) recebe um `eventID`
 * gerado aqui e passado tanto para o fbq() quanto para a API do backend.
 * A Meta usa o mesmo event_id para descartar duplicatas automaticamente.
 *
 * Eventos mapeados:
 *   step1_view   — usuário chegou no Step 1
 *   step1_next   — avançou do Step 1 com cidade/bairro/plano escolhidos
 *   step2_next   — avançou do Step 2 com dados pessoais preenchidos
 *   step3_submit — clicou em "Confirmar" no Step 3
 *   lead_success — backend retornou sucesso (lead gravado no SGP)
 *   lead_error   — backend retornou erro
 */

// ─── Tipos ────────────────────────────────────────────────────────────────────

declare global {
  interface Window {
    dataLayer: Record<string, unknown>[]
    fbq: (...args: unknown[]) => void
  }
}

type GTMEvent = Record<string, unknown> & { event: string }

// ─── Helpers internos ─────────────────────────────────────────────────────────

function pushGTM(payload: GTMEvent) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push(payload)
}

function pushPixel(eventName: string, params?: Record<string, unknown>, eventID?: string) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  const options = eventID ? { eventID } : undefined
  if (params) {
    window.fbq('track', eventName, params, options)
  } else {
    window.fbq('trackCustom', eventName, {}, options)
  }
}

/** Lê o cookie _fbp do navegador (usado para enriquecer o CAPI no backend) */
function getFbp(): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('_fbp='))
    ?.split('=')[1]
}

/** Lê o GA client_id do cookie _ga */
export function getGaClientId(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const raw = document.cookie
    .split('; ')
    .find(row => row.startsWith('_ga='))
    ?.split('=')[1]
  if (!raw) return undefined
  // Formato: GA1.1.XXXXXXXXXX.XXXXXXXXXX → retorna a parte numérica
  const parts = raw.split('.')
  return parts.length >= 4 ? `${parts[2]}.${parts[3]}` : raw
}

/** Lê o GA session_id do cookie _ga_<MEASUREMENT_ID> (detectado por padrão, sem depender de env var) */
export function getGaSessionId(): string | undefined {
  if (typeof document === 'undefined') return undefined
  const match = document.cookie.match(/_ga_[A-Z0-9]+=([^;]+)/)
  if (!match) return undefined
  // Formato: GS1.1.<session_id>.<contador>.<engaged>...
  const parts = decodeURIComponent(match[1]).split('.')
  return parts.length >= 3 ? parts[2] : undefined
}

/** Monta o bloco de contexto do navegador para enviar ao backend */
export function getBrowserContext() {
  return {
    client_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    fbp: getFbp(),
    ga_client_id: getGaClientId(),
    ga_session_id: getGaSessionId(),
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/** Disparo automático quando a página/formulário carrega */
export function trackPageView() {
  pushGTM({ event: 'kn_page_view', page: 'pre_cadastro' })
  // fbq PageView já foi disparado no snippet do layout
}

/** Usuário visualizou o Step 1 */
export function trackStep1View() {
  pushGTM({ event: 'kn_step1_view' })
  pushPixel('kn_step1_view')
}

/**
 * Usuário avançou do Step 1 (cidade / bairro / plano escolhidos)
 * Retorna o eventID gerado — deve ser enviado junto ao POST /api/step1
 * para deduplicação do evento InitiateCheckout no CAPI.
 */
export function trackStep1Next(data: {
  cidade: string
  bairro: string
  plano: string
  vencimento: string
  sessionId: string
}) {
  const eventID = `kn_step1_${data.sessionId}`

  pushGTM({
    event: 'kn_step1_complete',
    kn_cidade:    data.cidade,
    kn_bairro:    data.bairro,
    kn_plano:     data.plano,
    kn_vencimento: data.vencimento,
  })

  // InitiateCheckout client-side — espelhado no CAPI server-side com mesmo eventID
  pushPixel('InitiateCheckout', {
    content_name:     data.plano,
    content_category: `${data.cidade} – ${data.bairro}`,
  }, eventID)

  return eventID
}

/**
 * Usuário avançou do Step 2 (dados pessoais preenchidos)
 * Retorna o eventID — deve ser enviado junto ao POST /api/step2.
 */
export function trackStep2Next(leadId: number) {
  const eventID = `kn_step2_${leadId}`

  pushGTM({ event: 'kn_step2_complete' })

  // Lead client-side — espelhado no CAPI server-side com mesmo eventID
  pushPixel('Lead', {}, eventID)

  return eventID
}

/**
 * Usuário clicou em "Confirmar" no Step 3 (submit iniciado)
 * Retorna o eventID — deve ser enviado junto ao POST /api/submit.
 */
export function trackStep3Submit(leadId: number | null, sessionId: string) {
  const eventID = `kn_submit_${leadId ?? sessionId}`
  pushGTM({ event: 'kn_step3_submit' })
  pushPixel('kn_step3_submit', {}, eventID)
  return eventID
}

/**
 * Lead gravado com sucesso no SGP
 * CompleteRegistration client-side — espelhado no CAPI server-side.
 */
export function trackLeadSuccess(data: {
  cidade: string
  bairro: string
  plano: string
  leadId: number | null
  sessionId: string
}) {
  const eventID = `kn_submit_${data.leadId ?? data.sessionId}`

  pushGTM({
    event:     'kn_lead_success',
    kn_cidade: data.cidade,
    kn_bairro: data.bairro,
    kn_plano:  data.plano,
  })

  // Mesmo eventID do trackStep3Submit → Meta deduplica automaticamente
  pushPixel('CompleteRegistration', {
    content_name:     data.plano,
    content_category: `${data.cidade} – ${data.bairro}`,
    status:           'success',
  }, eventID)
}

/** Erro no submit */
export function trackLeadError(reason: string) {
  pushGTM({ event: 'kn_lead_error', error_reason: reason })
  pushPixel('kn_lead_error', { reason })
}
