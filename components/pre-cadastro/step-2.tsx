"use client"

import { User, ArrowRight, ArrowLeft } from "lucide-react"
import { CardHeader } from "./card-header"
import { SectionTitle } from "./section-title"
import { formatCPF, formatPhone } from "@/lib/formatters"
import { cn } from "@/lib/utils"

interface Step2Props {
  nome: string
  setNome: (value: string) => void
  cpf: string
  setCpf: (value: string) => void
  email: string
  setEmail: (value: string) => void
  whatsapp: string
  setWhatsapp: (value: string) => void
  telefoneFixo: string
  setTelefoneFixo: (value: string) => void
  telefoneResidencial: string
  setTelefoneResidencial: (value: string) => void
  errors: Record<string, boolean>
  onNext: () => void
  onBack: () => void
}

export function Step2({
  nome,
  setNome,
  cpf,
  setCpf,
  email,
  setEmail,
  whatsapp,
  setWhatsapp,
  telefoneFixo,
  setTelefoneFixo,
  telefoneResidencial,
  setTelefoneResidencial,
  errors,
  onNext,
  onBack,
}: Step2Props) {
  const inputClass = (hasError: boolean) =>
    cn(
      "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none",
      "placeholder:text-muted-foreground placeholder:text-sm",
      "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
      hasError && "border-destructive"
    )

  return (
    <div>
      <CardHeader
        icon={User}
        badge="Dados Pessoais"
        title="Suas Informações"
        description="Preencha seus dados para o pré-cadastro"
      />

      <div className="p-6 md:p-8">
        {/* Identificação */}
        <div className="mb-8">
          <SectionTitle>Identificação</SectionTitle>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                Nome Completo <span className="text-primary text-[0.9em]">*</span>
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Digite seu nome completo"
                className={inputClass(errors.nome)}
              />
              {errors.nome && (
                <span className="text-xs font-medium text-destructive">
                  Nome completo é obrigatório (mín. 3 caracteres)
                </span>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                  CPF <span className="text-primary text-[0.9em]">*</span>
                </label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={inputClass(errors.cpf)}
                />
                {errors.cpf && (
                  <span className="text-xs font-medium text-destructive">CPF inválido</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                  E-mail <span className="text-primary text-[0.9em]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputClass(errors.email)}
                />
                {errors.email && (
                  <span className="text-xs font-medium text-destructive">E-mail inválido</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="mb-0">
          <SectionTitle>Contato</SectionTitle>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                WhatsApp <span className="text-primary text-[0.9em]">*</span>
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(formatPhone(e.target.value))}
                placeholder="(21) 99999-9999"
                maxLength={15}
                className={inputClass(errors.whatsapp)}
              />
              {errors.whatsapp && (
                <span className="text-xs font-medium text-destructive">WhatsApp inválido</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground">
                Tel. Fixo
              </label>
              <input
                type="text"
                value={telefoneFixo}
                onChange={(e) => setTelefoneFixo(formatPhone(e.target.value))}
                placeholder="(21) 0000-0000"
                maxLength={15}
                className={inputClass(false)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground">
                Tel. Residencial
              </label>
              <input
                type="text"
                value={telefoneResidencial}
                onChange={(e) => setTelefoneResidencial(formatPhone(e.target.value))}
                placeholder="(21) 0000-0000"
                maxLength={15}
                className={inputClass(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-muted border-t border-border flex gap-3">
        <button
          onClick={onBack}
          className="h-[54px] px-6 bg-transparent text-foreground border-[1.5px] border-border rounded-xl font-heading text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-foreground/5"
        >
          <ArrowLeft className="w-[18px] h-[18px]" />
          Voltar
        </button>
        <button
          onClick={onNext}
          className="flex-1 h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(249,115,22,0.4)] active:translate-y-0"
        >
          Continuar — Endereço
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
