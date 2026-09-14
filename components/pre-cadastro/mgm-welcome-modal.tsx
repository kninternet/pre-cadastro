"use client"

import { useState, useCallback, useEffect } from "react"
import { Users, X } from "lucide-react"
import Image from "next/image"

interface MgmWelcomeModalProps {
  onSubmit: (data: { visitanteName: string; indicadorNome: string }) => void
}

export function MgmWelcomeModal({ onSubmit }: MgmWelcomeModalProps) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState("")
  const [indicador, setIndicador] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 300)
    return () => clearTimeout(t)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!nome.trim()) {
      setError("Informe seu nome")
      return
    }
    if (!indicador.trim()) {
      setError("Informe quem te indicou")
      return
    }
    setOpen(false)
    onSubmit({
      visitanteName: nome.trim(),
      indicadorNome: indicador.trim(),
    })
  }, [nome, indicador, onSubmit])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") handleSubmit()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [open, handleSubmit])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
      >
        {/* Header */}
        <div className="px-6 py-6 flex flex-col items-center text-center gap-3" style={{ background: "var(--secondary)" }}>
          <Image
            src="/logo-kn-internet.jpeg"
            alt="KN Internet"
            width={140}
            height={80}
            className="object-contain"
            priority
          />
          <div
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider text-white"
            style={{ background: "var(--primary)" }}
          >
            PROGRAMA DE INDICAÇÃO
          </div>
          <h2 className="font-heading text-[22px] font-extrabold leading-tight text-white">
            Amigo de Fibra
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Que bom que você está aqui! Este é o Programa de Indicação da KN Internet.
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                Qual o seu nome?
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => { setNome(e.target.value); setError("") }}
                placeholder="Seu primeiro nome"
                autoComplete="given-name"
                className="w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold" style={{ color: "var(--foreground)" }}>
                Quem te indicou?
              </label>
              <input
                type="text"
                value={indicador}
                onChange={(e) => { setIndicador(e.target.value); setError("") }}
                placeholder="Nome de quem te indicou"
                autoComplete="off"
                className="w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
              />
            </div>

            {error && (
              <p className="text-xs font-medium" style={{ color: "var(--destructive)" }}>
                {error}
              </p>
            )}
          </div>

          <button
            onClick={handleSubmit}
            className="w-full h-[50px] rounded-xl font-heading text-[16px] font-bold text-white border-none cursor-pointer transition-all mt-5 hover:bg-[#ea6c0a] hover:-translate-y-0.5"
            style={{ background: "var(--primary)", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}
