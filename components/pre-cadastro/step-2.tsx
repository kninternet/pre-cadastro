"use client"

import { useState } from "react"
import { Wifi, ArrowRight, ArrowLeft, Check, AlertTriangle } from "lucide-react"
import { CardHeader } from "./card-header"
import { SectionTitle } from "./section-title"
import { DATA, Plan } from "@/lib/data"
import { formatCPF, validateCPF } from "@/lib/formatters"
import { cn } from "@/lib/utils"

const WA_ATENDIMENTO = "https://wa.me/5521967797580"

interface Step2Props {
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
  cpf: string
  setCpf: (value: string) => void
  errors: Record<string, boolean>
  onNext: () => void
  onBack: () => void
}

export function Step2({
  cidade, setCidade,
  bairro, setBairro,
  plano, setPlano,
  vencimento, setVencimento,
  aceitaTaxaInstalacao, setAceitaTaxaInstalacao,
  cpf, setCpf,
  errors,
  onNext, onBack,
}: Step2Props) {
  const [cpfStatus, setCpfStatus] = useState<"idle" | "checking" | "free" | "duplicate">("idle")
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)

  const bairros = cidade ? Object.keys(DATA[cidade]?.bairros || {}) : []
  const planos: Plan[] = cidade && bairro ? DATA[cidade]?.bairros[bairro] || [] : []
  const vencimentos = cidade ? DATA[cidade]?.vencimentos || [] : []
  const showSummary = cidade && bairro && plano && vencimento

  const selectClass = (hasError: boolean) =>
    cn(
      "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none appearance-none cursor-pointer",
      "bg-[url('data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2716%27 height=%2716%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%239aa3b0%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3E%3Cpath d=%27M6 9l6 6 6-6%27/%3E%3C/svg%3E')] bg-no-repeat bg-[right_0.75rem_center] pr-10",
      "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
      hasError && "border-destructive"
    )

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

  const handleCpfChange = (value: string) => {
    const formatted = formatCPF(value)
    setCpf(formatted)
    setShowDuplicateModal(false)

    const digits = formatted.replace(/\D/g, "")
    if (digits.length === 11 && validateCPF(formatted)) {
      setCpfStatus("checking")
      fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/check-cpf?cpf=${digits}`)
        .then(r => r.json())
        .then(data => {
          if (data.found) {
            setCpfStatus("duplicate")
            setShowDuplicateModal(true)
          } else {
            setCpfStatus("free")
          }
        })
        .catch(() => setCpfStatus("idle"))
    } else {
      if (cpfStatus !== "idle") setCpfStatus("idle")
    }
  }

  return (
    <>
      {/* Modal CPF duplicado */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div
            className="w-full max-w-[400px] rounded-2xl p-6 shadow-2xl"
            style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: "rgba(249,115,22,0.1)" }}
              >
                <AlertTriangle className="w-7 h-7" style={{ color: "var(--primary)" }} />
              </div>

              <div>
                <h3 className="font-heading text-[18px] font-extrabold mb-1.5" style={{ color: "var(--foreground)" }}>
                  CPF já cadastrado
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  Identificamos que este CPF já possui um cadastro na KN Internet. Como quer continuar?
                </p>
              </div>

              <div className="w-full flex flex-col gap-2.5">
                <a
                  href={`mailto:atendimento@kninternet.com.br?subject=${encodeURIComponent("Novo ponto de instalação")}&body=${encodeURIComponent("Olá! Já sou cliente KN Internet e gostaria de um novo ponto de instalação.")}`}
                  className="w-full h-[48px] rounded-xl font-heading text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: "var(--primary)", boxShadow: "0 4px 16px rgba(249,115,22,0.28)" }}
                  onClick={() => setShowDuplicateModal(false)}
                >
                  atendimento@kninternet.com.br
                </a>

                <a
                  href={`${WA_ATENDIMENTO}?text=${encodeURIComponent("Olá! Já sou cliente KN Internet e gostaria de um novo ponto de instalação.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-[48px] rounded-xl font-heading text-[15px] font-bold text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: "#25D366", boxShadow: "0 4px 16px rgba(37,211,102,0.28)" }}
                  onClick={() => setShowDuplicateModal(false)}
                >
                  WhatsApp
                </a>

                <button
                  onClick={() => {
                    setShowDuplicateModal(false)
                    setCpf("")
                    setCpfStatus("idle")
                  }}
                  className="w-full h-[48px] rounded-xl font-heading text-[15px] font-bold transition-all"
                  style={{
                    background: "transparent",
                    border: "1.5px solid var(--border)",
                    color: "var(--foreground)",
                  }}
                >
                  Corrigir CPF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div>
        <CardHeader
          icon={Wifi}
          badge="Cobertura & Plano"
          title="Disponibilidade e Plano"
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
                  className={selectClass(errors.cidade)}
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
                  className={cn(selectClass(errors.bairro), "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-muted")}
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
                      <div className="font-heading text-xl font-extrabold text-foreground leading-tight">{pl.v}</div>
                      <div className="text-sm font-semibold text-primary mt-1">{pl.p}/mês</div>
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
                  aceitaTaxaInstalacao ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40",
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
                  aceitaTaxaInstalacao ? "bg-primary border-primary" : errors.aceitaTaxaInstalacao ? "border-destructive" : "border-border bg-input"
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

          {/* CPF */}
          {cidade && (
            <div className="mb-4">
              <SectionTitle>Identificação</SectionTitle>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                  CPF <span className="text-primary text-[0.9em]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={cn(
                      "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none",
                      "placeholder:text-muted-foreground placeholder:text-sm",
                      "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
                      errors.cpf && "border-destructive",
                      cpfStatus === "free" && "border-green-500",
                      cpfStatus === "duplicate" && "border-orange-400",
                    )}
                  />
                  {cpfStatus === "checking" && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
                  )}
                  {cpfStatus === "free" && (
                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                  )}
                </div>
                {errors.cpf && (
                  <span className="text-xs font-medium text-destructive">CPF inválido</span>
                )}
                {cpfStatus === "duplicate" && !showDuplicateModal && (
                  <span className="text-xs font-medium" style={{ color: "var(--primary)" }}>
                    CPF já cadastrado —{" "}
                    <button onClick={() => setShowDuplicateModal(true)} className="underline cursor-pointer">
                      ver opções
                    </button>
                  </span>
                )}
              </div>
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
        <div className="p-6 bg-muted border-t border-border flex gap-3">
          <button
            onClick={onBack}
            className="h-[54px] px-6 bg-transparent text-foreground border-[1.5px] border-border rounded-xl font-heading text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-foreground/5"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            Voltar
          </button>
          <button
            onClick={() => {
              if (cpfStatus === "duplicate") {
                setShowDuplicateModal(true)
                return
              }
              onNext()
            }}
            className="flex-1 h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(249,115,22,0.4)] active:translate-y-0"
          >
            Continuar — Endereço
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </>
  )
}