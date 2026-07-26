"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Cookie } from "lucide-react"

const STORAGE_KEY = "kn_cookie_consent_v1"

type ConsentValue = "granted" | "denied"

function gtagUpdate(value: ConsentValue) {
  if (typeof window === "undefined") return
  const w = window as unknown as { dataLayer: unknown[]; fbq?: (...a: unknown[]) => void }
  w.dataLayer = w.dataLayer || []
  // gtag() empurra os próprios "arguments" no dataLayer (padrão do Consent Mode)
  w.dataLayer.push(["consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  }])
  // Sinaliza o evento para o GTM disparar tags que aguardam consentimento
  w.dataLayer.push({ event: value === "granted" ? "consent_granted" : "consent_denied" })
}

function fbqConsent(value: ConsentValue) {
  if (typeof window === "undefined") return
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq
  if (typeof fbq !== "function") return
  fbq("consent", value === "granted" ? "grant" : "revoke")
  if (value === "granted") {
    // Dispara o PageView represado somente após o consentimento
    fbq("track", "PageView")
  }
}

export function CookieConsent({ metaPixelId }: { metaPixelId?: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "granted") {
        gtagUpdate("granted")
        fbqConsent("granted")
      } else if (saved === "denied") {
        // já respondido — mantém negado, não mostra banner
      } else {
        setVisible(true)
      }
    } catch {
      setVisible(true)
    }
    // metaPixelId presente apenas para deixar explícita a dependência de Pixel
  }, [metaPixelId])

  const decide = (value: ConsentValue) => {
    try { localStorage.setItem(STORAGE_KEY, value) } catch {}
    gtagUpdate(value)
    fbqConsent(value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] p-4 md:p-5"
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
    >
      <div
        className="mx-auto max-w-[650px] rounded-2xl border-1 shadow-2xl p-5 md:p-4"
        style={{ background: "#c2c2c2", borderColor: "#0C1E3D" }}
      >
        <div className="flex items-start gap-4">
          

          <div className="flex-1">
            <h2 className="font-heading text-[16px] font-extrabold mb-1.5" style={{ color: "var(--foreground)" }}>
              Sua privacidade
            </h2>
            <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
              Usamos cookies para medir e melhorar sua experiência e nossas campanhas. Os dados que você
              informa no cadastro são tratados conforme nossa{" "}
              <Link href="/privacidade" className="font-semibold underline" style={{ color: "var(--primary)" }}>
                Política de Privacidade
              </Link>
              . Você pode aceitar ou recusar os cookies de análise e marketing.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
              <button
                onClick={() => decide("granted")}
                className="flex-1 h-[46px] rounded-xl font-heading text-[14px] font-bold text-white transition-all"
                style={{ background: "var(--primary)", boxShadow: "0 4px 14px rgba(249,115,22,0.28)" }}
              >
                Aceitar
              </button>
              <button
                onClick={() => decide("denied")}
                className="flex-1 h-[46px] rounded-xl font-heading text-[14px] font-bold transition-all"
                style={{ background: "transparent", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
              >
                Recusar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}