/**
 * meta-capi.ts — KN Internet
 *
 * Envia eventos server-side para a Meta Conversions API (CAPI).
 * Todos os dados de usuário são hasheados em SHA-256 antes do envio,
 * conforme exigido pela Meta.
 *
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api
 */

import { createHash } from 'crypto'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserData {
  email?: string
  phone?: string       // somente dígitos, com DDI (ex: 5521999999999)
  firstName?: string
  lastName?: string
  city?: string
  state?: string       // UF em minúsculo (ex: 'rj')
  zipCode?: string     // somente dígitos
  country?: string     // ISO 3166-1 alpha-2 em minúsculo (ex: 'br')
  clientIpAddress?: string
  clientUserAgent?: string
  fbp?: string         // cookie _fbp
  fbc?: string         // cookie _fbc
}

interface CustomData {
  contentName?: string   // ex: nome do plano
  contentCategory?: string
  value?: number
  currency?: string      // ex: 'BRL'
  status?: string
}

interface CAPIEventParams {
  eventName: string
  eventId: string        // usado para deduplicação com o pixel client-side
  eventSourceUrl?: string
  userData: UserData
  customData?: CustomData
}

// ─── Helper de hash ───────────────────────────────────────────────────────────

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function hashUserData(u: UserData) {
  const hashed: Record<string, string | undefined> = {}

  if (u.email)     hashed.em     = sha256(u.email)
  if (u.phone)     hashed.ph     = sha256(u.phone.replace(/\D/g, ''))
  if (u.firstName) hashed.fn     = sha256(u.firstName.split(' ')[0])
  if (u.lastName)  hashed.ln     = sha256(u.lastName)
  if (u.city)      hashed.ct     = sha256(u.city)
  if (u.state)     hashed.st     = sha256(u.state.toLowerCase())
  if (u.zipCode)   hashed.zp     = sha256(u.zipCode.replace(/\D/g, ''))
  if (u.country)   hashed.country = sha256(u.country.toLowerCase())

  // Estes campos NÃO são hasheados
  if (u.clientIpAddress) hashed.client_ip_address = u.clientIpAddress
  if (u.clientUserAgent) hashed.client_user_agent = u.clientUserAgent
  if (u.fbp)             hashed.fbp = u.fbp
  if (u.fbc)             hashed.fbc = u.fbc

  return hashed
}

// ─── Função principal ─────────────────────────────────────────────────────────

export async function sendCAPIEvent(params: CAPIEventParams): Promise<void> {
  const pixelId = process.env.META_PIXEL_ID
  const token   = process.env.META_CAPI_TOKEN

  if (!pixelId || !token) {
    console.warn('[META CAPI] META_PIXEL_ID ou META_CAPI_TOKEN não configurados')
    return
  }

  const payload = {
    data: [
      {
        event_name:        params.eventName,
        event_time:        Math.floor(Date.now() / 1000),
        event_id:          params.eventId,
        event_source_url:  params.eventSourceUrl ?? 'https://cadastro.kninternet.com.br',
        action_source:     'website',
        user_data:         hashUserData(params.userData),
        ...(params.customData && {
          custom_data: {
            content_name:     params.customData.contentName,
            content_category: params.customData.contentCategory,
            value:            params.customData.value,
            currency:         params.customData.currency ?? 'BRL',
            status:           params.customData.status,
          },
        }),
      },
    ],
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${token}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      }
    )
    const json = await res.json()

    if (!res.ok) {
      console.error('[META CAPI ERROR]', JSON.stringify(json))
    } else {
      console.log(`[META CAPI] ${params.eventName} enviado — event_id: ${params.eventId}`)
    }
  } catch (err) {
    // CAPI nunca derruba o fluxo principal
    console.error('[META CAPI EXCEPTION]', err)
  }
}
