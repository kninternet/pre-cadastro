'use client'

import Script from 'next/script'
import { usePathname } from 'next/navigation'

// Webchat Fluenzo — canal alternativo ao WhatsApp (evita custo por mensagem
// de serviço da Meta a partir de 01/10/2026). Carregado em lazyOnload para
// não impactar o LCP do formulário.
const FLUENZO_WEBCHAT_KEY = 'khjw2cnr5xge'

export function FluenzoWebchat() {
  const pathname = usePathname()

  // Painel interno dos atendentes não exibe o chat
  if (pathname?.startsWith('/atendimento')) return null

  return (
    <Script
      id="fluenzo-webchat"
      src="https://app.fluenzochat.com.br/webchat.js"
      data-key={FLUENZO_WEBCHAT_KEY}
      strategy="lazyOnload"
    />
  )
}
