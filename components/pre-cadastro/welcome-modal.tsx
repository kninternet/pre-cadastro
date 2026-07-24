"use client"

import { useEffect, useState, useCallback } from "react"
import { Wifi, X, FileText, MapPin } from "lucide-react"

const STORAGE_KEY = "kn_welcome_shown"

export function WelcomeModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const alreadyShown = localStorage.getItem(STORAGE_KEY)
    if (!alreadyShown) {
      const t = setTimeout(() => setOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [])

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1")
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose()
      if (e.key === "Enter") handleClose()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, handleClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
      >
        {/* Header */}
        <div className="px-6 py-5 flex items-center gap-3" style={{ background: "var(--secondary)" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(249,115,22,0.18)" }}>
            <Wifi className="w-5 h-5" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.55)" }}>
              KN Internet
            </p>
            <h2 className="font-heading text-[18px] font-extrabold leading-tight" style={{ color: "white" }}>
              Olá, quase lá!
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="ml-auto w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.1)" }}
            aria-label="Fechar"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-[15px] leading-relaxed mb-5" style={{ color: "var(--foreground)" }}>
            Preencha este formulário simples para iniciarmos o processo de{" "}
            <strong>verificação e instalação</strong> da sua internet.
          </p>

          <p className="text-[13px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--muted-foreground)" }}>
            Tenha em mãos:
          </p>

          <div className="flex flex-col gap-2.5 mb-6">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--muted)", border: "1.5px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
                <FileText className="w-4 h-4" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>Número do CPF ou CNPJ</p>
                <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>Para iniciarmos seu cadastro</p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--muted)", border: "1.5px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(249,115,22,0.12)" }}>
                <MapPin className="w-4 h-4" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <p className="text-[14px] font-bold" style={{ color: "var(--foreground)" }}>CEP do endereço de instalação</p>
                <p className="text-[12px]" style={{ color: "var(--muted-foreground)" }}>Local onde a internet será instalada</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="w-full h-[50px] rounded-xl font-heading text-[16px] font-bold text-white border-none cursor-pointer transition-all hover:bg-[#ea6c0a] hover:-translate-y-0.5"
            style={{ background: "var(--primary)", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}