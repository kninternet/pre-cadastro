"use client"

import { User, ArrowRight } from "lucide-react"
import { CardHeader } from "./card-header"
import { SectionTitle } from "./section-title"
import { cn } from "@/lib/utils"

interface Step1Props {
  nome: string
  setNome: (value: string) => void
  email: string
  setEmail: (value: string) => void
  whatsapp: string
  setWhatsapp: (value: string) => void
  errors: Record<string, boolean>
  onNext: () => void
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
}

export function Step1({
  nome, setNome,
  email, setEmail,
  whatsapp, setWhatsapp,
  errors,
  onNext,
}: Step1Props) {
  const inputClass = (hasError: boolean) =>
    cn(
      "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none",
      "placeholder:text-muted-foreground placeholder:text-sm",
      "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
      hasError && "border-destructive"
    )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") onNext()
  }

  const handleWhatsappChange = (value: string) => {
    setWhatsapp(formatPhone(value))
  }

  return (
    <div>
      <CardHeader
        icon={User}
        badge="Seus Dados"
        title="Vamos começar!"
        description="Preencha seus dados de contato para continuar."
      />

      <div className="p-6 md:p-8">
        <div className="mb-6">
          <SectionTitle>Dados pessoais</SectionTitle>
          <div className="flex flex-col gap-4">

            {/* Nome */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                Nome completo <span className="text-primary text-[0.9em]">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite seu nome completo"
                autoComplete="name"
                className={inputClass(errors.nome)}
              />
              {errors.nome && (
                <span className="text-xs font-medium text-destructive">
                  Nome completo é obrigatório (mín. 3 caracteres)
                </span>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                E-mail <span className="text-primary text-[0.9em]">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="seu@email.com"
                autoComplete="email"
                className={inputClass(errors.email)}
              />
              {errors.email && (
                <span className="text-xs font-medium text-destructive">Coloque um email válido</span>
              )}
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                WhatsApp <span className="text-primary text-[0.9em]">*</span>
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => handleWhatsappChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="(21) 99999-9999"
                autoComplete="tel"
                maxLength={15}
                inputMode="numeric"
                className={inputClass(errors.whatsapp)}
              />
              {errors.whatsapp && (
                <span className="text-xs font-medium text-destructive">WhatsApp inválido</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-muted border-t border-border">
        <button
          onClick={onNext}
          className="w-full h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(249,115,22,0.4)] active:translate-y-0"
        >
          Continuar
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
