/**
 * analytics.ts — KN Internet
 *
 * Centraliza todos os disparos de eventos para:
 *   • GTM dataLayer  → GA4 + qualquer outra tag configurada no GTM
 *   • Meta Pixel fbq → Eventos padrão e customizados
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

function pushPixel(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  if (typeof window.fbq !== 'function') return
  if (params) {
    window.fbq('track', eventName, params)
  } else {
    window.fbq('trackCustom', eventName)
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
 * Passamos os dados para criar audiências segmentadas por região/plano
 */
export function trackStep1Next(data: {
  cidade: string
  bairro: string
  plano: string
  vencimento: string
}) {
  pushGTM({
    event: 'kn_step1_complete',
    kn_cidade: data.cidade,
    kn_bairro: data.bairro,
    kn_plano: data.plano,
    kn_vencimento: data.vencimento,
  })
  pushPixel('kn_step1_complete', {
    cidade: data.cidade,
    bairro: data.bairro,
    plano: data.plano,
  })
}

/** Usuário avançou do Step 2 (dados pessoais preenchidos) */
export function trackStep2Next() {
  pushGTM({ event: 'kn_step2_complete' })
  pushPixel('kn_step2_complete')
  // Meta: Lead padrão — indica intenção qualificada
  window.fbq?.('track', 'Lead')
}

/** Usuário clicou em "Confirmar" no Step 3 (submit iniciado) */
export function trackStep3Submit() {
  pushGTM({ event: 'kn_step3_submit' })
  pushPixel('kn_step3_submit')
}

/**
 * Lead gravado com sucesso no SGP
 * Este é o evento de conversão principal — mapear como Compra/CompleteRegistration
 */
export function trackLeadSuccess(data: {
  cidade: string
  bairro: string
  plano: string
}) {
  pushGTM({
    event: 'kn_lead_success',
    kn_cidade: data.cidade,
    kn_bairro: data.bairro,
    kn_plano: data.plano,
  })
  // Meta: CompleteRegistration = conversão principal
  window.fbq?.('track', 'CompleteRegistration', {
    content_name: data.plano,
    content_category: `${data.cidade} – ${data.bairro}`,
    status: 'success',
  })
}

/** Erro no submit */
export function trackLeadError(reason: string) {
  pushGTM({ event: 'kn_lead_error', error_reason: reason })
  pushPixel('kn_lead_error', { reason })
}
