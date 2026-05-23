"use client"

import { Wifi, ArrowRight, Check } from "lucide-react"
import { CardHeader } from "./card-header"
import { SectionTitle } from "./section-title"
import { DATA, Plan } from "@/lib/data"
import { cn } from "@/lib/utils"

interface Step1Props {
  cidade: string
  setCidade: (value: string) => void
  bairro: string
  setBairro: (value: string) => void
  plano: string
  setPlano: (value: string) => void
  vencimento: string
  setVencimento: (value: string) => void
  aceitaTaxaInstalacao: boolean
  setAceitaTaxaInstalacao: (value: boolean) => void
  errors: Record<string, boolean>
  onNext: () => void
}

export function Step1({
  cidade,
  setCidade,
  bairro,
  setBairro,
  plano,
  setPlano,
  vencimento,
  setVencimento,
  aceitaTaxaInstalacao,
  setAceitaTaxaInstalacao,
  errors,
  onNext,
}: Step1Props) {
  const bairros = cidade ? Object.keys(DATA[cidade]?.bairros || {}) : []
  const planos: Plan[] = cidade && bairro ? DATA[cidade]?.bairros[bairro] || [] : []
  const vencimentos = cidade ? DATA[cidade]?.vencimentos || [] : []

  const handleCidadeChange = (value: string) => {
    setCidade(value)
    setBairro("")
    setPlano("")
    setVencimento("")
  }

  const handleBairroChange = (value: string) => {
    setBairro(value)
    setPlano("")
  }

  const showSummary = cidade && bairro && plano && vencimento

  return (
    <div>
      <CardHeader
        icon={Wifi}
        badge="Cobertura & Plano"
        title="Localização e Plano de Internet"
        description="Informe sua cidade e bairro para ver os planos disponíveis"
      />

      <div className="p-6 md:p-8">
        {/* Localização */}
        <div className="mb-8">
          <SectionTitle>Onde você mora?</SectionTitle>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                Cidade <span className="text-primary text-[0.9em]">*</span>
              </label>
              <select
                value={cidade}
                onChange={(e) => handleCidadeChange(e.target.value)}
                className={cn(
                  "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none appearance-none cursor-pointer",
                  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%239aa3b0%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-10",
                  "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
                  errors.cidade && "border-destructive"
                )}
              >
                <option value="">Selecione a cidade</option>
                {Object.keys(DATA).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.cidade && (
                <span className="text-xs font-medium text-destructive">Selecione uma cidade</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                Bairro <span className="text-primary text-[0.9em]">*</span>
              </label>
              <select
                value={bairro}
                onChange={(e) => handleBairroChange(e.target.value)}
                disabled={!cidade}
                className={cn(
                  "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none appearance-none cursor-pointer",
                  "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%239aa3b0%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-10",
                  "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted",
                  errors.bairro && "border-destructive"
                )}
              >
                <option value="">{cidade ? "Selecione o bairro" : "Selecione a cidade primeiro"}</option>
                {bairros.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
              {errors.bairro && (
                <span className="text-xs font-medium text-destructive">Selecione um bairro</span>
              )}
            </div>
          </div>
        </div>

        {/* Planos */}
        {bairro && (
          <div className="mb-8">
            <SectionTitle>Escolha seu plano</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {planos.map((pl) => {
                const key = `${pl.v} - ${pl.p}`
                const isSelected = plano === key
                return (
                  <label
                    key={key}
                    className={cn(
                      "relative border-[1.5px] rounded-xl p-4 cursor-pointer transition-all bg-card",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(249,115,22,0.1)]"
                        : "border-border hover:border-primary/40 hover:bg-primary/[0.03]"
                    )}
                    onClick={() => setPlano(key)}
                  >
                    <input type="radio" name="plano" value={key} className="sr-only" checked={isSelected} onChange={() => setPlano(key)} />
                    <div className="font-heading text-xl font-extrabold text-foreground leading-tight">
                      {pl.v}
                    </div>
                    <div className="text-sm font-semibold text-primary mt-1">
                      {pl.p}/mês
                    </div>
                    {isSelected && (
                      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </label>
                )
              })}
            </div>
            {errors.plano && (
              <span className="text-xs font-medium text-destructive mt-2 block">Selecione um plano</span>
            )}
            <p className="text-xs text-muted-foreground mt-2">* Sujeito à viabilidade técnica do endereço</p>
          </div>
        )}

        {/* Vencimento */}
        {cidade && (
          <div className="mb-8">
            <SectionTitle>Dia do vencimento</SectionTitle>
            <label className="text-[13px] font-semibold text-foreground flex items-center gap-1 mb-3">
              Quando deseja pagar? <span className="text-primary text-[0.9em]">*</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {vencimentos.map((dia) => (
                <label
                  key={dia}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-5 py-2 border-[1.5px] rounded-full text-sm font-semibold cursor-pointer transition-all",
                    vencimento === dia
                      ? "border-primary bg-primary text-white shadow-[0_2px_8px_rgba(249,115,22,0.3)]"
                      : "border-border bg-card text-foreground hover:border-primary/40"
                  )}
                  onClick={() => setVencimento(dia)}
                >
                  <input type="radio" name="venc" value={dia} className="sr-only" checked={vencimento === dia} onChange={() => setVencimento(dia)} />
                  Dia {dia}
                </label>
              ))}
            </div>
            {errors.vencimento && (
              <span className="text-xs font-medium text-destructive mt-2 block">Selecione o vencimento</span>
            )}
          </div>
        )}

        {/* Taxa de Instalação */}
        {cidade && (
          <div className="mb-8">
            <label
              className={cn(
                "flex items-start gap-3 p-4 border-[1.5px] rounded-xl cursor-pointer transition-all",
                aceitaTaxaInstalacao
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40",
                errors.aceitaTaxaInstalacao && !aceitaTaxaInstalacao && "border-destructive bg-destructive/5"
              )}
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={aceitaTaxaInstalacao}
                onChange={(e) => setAceitaTaxaInstalacao(e.target.checked)}
              />
              <div className={cn(
                "mt-0.5 w-5 h-5 min-w-[20px] rounded border-[1.5px] flex items-center justify-center transition-all pointer-events-none",
                aceitaTaxaInstalacao
                  ? "bg-primary border-primary"
                  : errors.aceitaTaxaInstalacao
                    ? "border-destructive"
                    : "border-border bg-input"
              )}>
                {aceitaTaxaInstalacao && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
              <span className="text-[13px] text-foreground/80 leading-relaxed">
                Estou ciente de que será cobrada uma{" "}
                <strong className="text-foreground">taxa de instalação de R$&nbsp;150,00</strong>
                {" "}paga via <strong className="text-foreground">Pix</strong> no momento da instalação.
              </span>
            </label>
            {errors.aceitaTaxaInstalacao && !aceitaTaxaInstalacao && (
              <span className="text-xs font-medium text-destructive mt-2 block">
                Você precisa confirmar o aceite da taxa de instalação
              </span>
            )}
          </div>
        )}

        {/* Resumo */}
        {showSummary && (
          <div className="bg-foreground/[0.04] border border-foreground/[0.08] border-l-[3px] border-l-primary rounded-lg p-4 text-sm text-foreground/70 leading-relaxed">
            ✅ <strong className="text-foreground">{plano}</strong> em{" "}
            <strong className="text-foreground">{bairro}, {cidade}</strong> — vencimento todo dia{" "}
            <strong className="text-foreground">{vencimento}</strong>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 bg-muted border-t border-border">
        <button
          onClick={onNext}
          className="w-full h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(249,115,22,0.4)] active:translate-y-0"
        >
          Continuar — Dados Pessoais
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}