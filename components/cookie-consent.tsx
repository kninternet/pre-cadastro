"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const STORAGE_KEY = "kn_cookie_consent_v1"
export const WELCOME_DONE_EVENT = "kn:welcome-done"

type ConsentValue = "granted" | "denied"

function gtagUpdate(value: ConsentValue) {
  if (typeof window === "undefined") return
  const w = window as unknown as { dataLayer: unknown[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push(["consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  }])
  w.dataLayer.push({ event: value === "granted" ? "consent_granted" : "consent_denied" })
}

function fbqConsent(value: ConsentValue) {
  if (typeof window === "undefined") return
  const fbq = (window as unknown as { fbq?: (...a: unknown[]) => void }).fbq
  if (typeof fbq !== "function") return
  fbq("consent", value === "granted" ? "grant" : "revoke")
  if (value === "granted") fbq("track", "PageView")
}

export function CookieConsent({ metaPixelId }: { metaPixelId?: string }) {
  const [decided, setDecided] = useState<boolean>(true)
  const [welcomeDone, setWelcomeDone] = useState<boolean>(false)
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === "granted") {
        gtagUpdate("granted"); fbqConsent("granted"); setDecided(true)
      } else if (saved === "denied") {
        setDecided(true)
      } else {
        setDecided(false)
      }
    } catch {
      setDecided(false)
    }
  }, [metaPixelId])

  useEffect(() => {
    let welcomePendente = false
    try {
      welcomePendente = localStorage.getItem("kn_welcome_shown") == null
    } catch {}

    if (!welcomePendente) {
      setWelcomeDone(true)
    }

    const onDone = () => setWelcomeDone(true)
    window.addEventListener(WELCOME_DONE_EVENT, onDone)
    return () => window.removeEventListener(WELCOME_DONE_EVENT, onDone)
  }, [])

  const show = !decided && welcomeDone

  useEffect(() => {
    if (show) {
      const t = setTimeout(() => setEntered(true), 20)
      return () => clearTimeout(t)
    }
    setEntered(false)
  }, [show])

  const decide = (value: ConsentValue) => {
    try { localStorage.setItem(STORAGE_KEY, value) } catch {}
    gtagUpdate(value); fbqConsent(value)
    setEntered(false)
    setTimeout(() => setDecided(true), 200)
  }

  if (!show) return null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[55] pointer-events-none"
      role="dialog"
      aria-live="polite"
      aria-label="Aviso de cookies"
    >
      <div
        className="pointer-events-auto w-full transition-transform duration-300 ease-out"
        style={{
          transform: entered ? "translateY(0)" : "translateY(100%)",
          background: "#0C1E3D",
          borderTop: "2px solid var(--primary)",
        }}
      >
        <div className="mx-auto max-w-[900px] px-4 py-3.5 md:px-6 md:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <p className="text-[13px] leading-relaxed text-white/85 flex-1">
            Usamos cookies para medir e melhorar sua experiência e nossas campanhas. Ao continuar, você
            concorda com nossa{" "}
            <Link href="/privacidade" className="font-semibold underline text-white hover:text-[var(--primary)]">
              Política de Privacidade
            </Link>
            . Você pode aceitar ou recusar os cookies de análise e marketing.
          </p>

          <div className="flex gap-2.5 flex-shrink-0">
            <button
              onClick={() => decide("denied")}
              className="h-[40px] px-5 rounded-lg text-[13px] font-bold transition-all text-white/90 hover:text-white"
              style={{ background: "transparent", border: "1.5px solid rgba(255,255,255,0.25)" }}
            >
              Recusar
            </button>
            <button
              onClick={() => decide("granted")}
              className="h-[40px] px-6 rounded-lg text-[13px] font-bold text-white transition-all hover:brightness-110"
              style={{ background: "var(--primary)", boxShadow: "0 4px 14px rgba(249,115,22,0.35)" }}
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
