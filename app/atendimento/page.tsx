"use client"

import { useState } from "react"
import Image from "next/image"
import { AtendimentoForm } from "@/components/atendimento/atendimento-form"
import { Lock } from "lucide-react"

const PIN_CORRETO = process.env.NEXT_PUBLIC_ATENDIMENTO_PIN ?? ""

export default function AtendimentoPage() {
  const [pin, setPin] = useState("")
  const [autenticado, setAutenticado] = useState(false)
  const [erro, setErro] = useState(false)

  const handlePin = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 4)
    setPin(digits)
    setErro(false)
    if (digits.length === 4) {
      if (digits === PIN_CORRETO) {
        setAutenticado(true)
      } else {
        setErro(true)
        setTimeout(() => setPin(""), 800)
      }
    }
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--background)" }}>
        <div className="page-bg"><div className="dot-grid" /></div>
        <div className="relative z-10 w-full max-w-[360px]">
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo-kn-internet.jpeg" alt="KN Internet" width={140} height={84} className="object-contain mb-4" priority />
            <span className="text-[12px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: "rgba(249,115,22,0.1)", color: "var(--primary)" }}>
              Formulário de Atendimento
            </span>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
              <Lock className="w-6 h-6" style={{ color: "var(--primary)" }} />
            </div>
            <div className="text-center">
              <h2 className="font-heading text-[18px] font-extrabold mb-1" style={{ color: "var(--foreground)" }}>Acesso restrito</h2>
              <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>Digite o PIN de 4 dígitos para continuar</p>
            </div>

            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={e => handlePin(e.target.value)}
              placeholder="• • • •"
              autoFocus
              className="w-full h-[54px] text-center text-[28px] tracking-[0.5em] font-bold rounded-xl border-[1.5px] outline-none transition-all"
              style={{
                background: "var(--input)",
                borderColor: erro ? "var(--destructive)" : pin.length === 4 ? "var(--primary)" : "var(--border)",
                color: "var(--foreground)",
              }}
            />
            {erro && <p className="text-[13px] font-medium" style={{ color: "var(--destructive)" }}>PIN incorreto</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 pb-16">
      <div className="page-bg"><div className="dot-grid" /></div>
      <header className="w-full max-w-[560px] flex flex-col items-center py-6 pb-8 text-center gap-3">
        <Image src="/logo-kn-internet.jpeg" alt="KN Internet" width={160} height={96} className="object-contain" priority />
        <span className="text-[12px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
          style={{ background: "rgba(249,115,22,0.1)", color: "var(--primary)" }}>
          Formulário de Atendimento
        </span>
      </header>
      <AtendimentoForm />
    </div>
  )
}