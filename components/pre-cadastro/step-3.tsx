"use client"

import { MapPin, Send, ArrowLeft, Shield, Loader2, AlertTriangle } from "lucide-react"
import { CardHeader } from "./card-header"
import { SectionTitle } from "./section-title"
import { formatCEP } from "@/lib/formatters"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useState } from "react"

interface Step3Props {
  cidade: string // cidade selecionada no Step 1 — usada para validar o CEP
  cep: string
  setCep: (value: string) => void
  logradouro: string
  setLogradouro: (value: string) => void
  numero: string
  setNumero: (value: string) => void
  complemento: string
  setComplemento: (value: string) => void
  bairroCep: string
  setBairroCep: (value: string) => void
  cidadeEndereco: string
  setCidadeEndereco: (value: string) => void
  estado: string
  setEstado: (value: string) => void
  pontoReferencia: string
  setPontoReferencia: (value: string) => void
  errors: Record<string, boolean>
  onSubmit: () => Promise<void>
  onBack: () => void
  isSubmitting: boolean
}

export function Step3({
  cidade,
  cep,
  setCep,
  logradouro,
  setLogradouro,
  numero,
  setNumero,
  complemento,
  setComplemento,
  bairroCep,
  setBairroCep,
  cidadeEndereco,
  setCidadeEndereco,
  estado,
  setEstado,
  pontoReferencia,
  setPontoReferencia,
  errors,
  onSubmit,
  onBack,
  isSubmitting,
}: Step3Props) {
  const [loadingCep, setLoadingCep] = useState(false)
  const [cityMismatch, setCityMismatch] = useState<string | null>(null)

  const inputClass = (hasError: boolean, readOnly = false) =>
    cn(
      "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none",
      "placeholder:text-muted-foreground placeholder:text-sm",
      "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
      readOnly && "bg-muted text-muted-foreground cursor-default",
      hasError && "border-destructive"
    )

  // Normalize city name for comparison (remove accents, lowercase)
  const normalizeName = (s: string) =>
    s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value)
    setCep(formatted)
    setCityMismatch(null)

    // Reset address fields when CEP changes
    if (formatted.replace(/\D/g, "").length < 8) {
      setLogradouro("")
      setBairroCep("")
      setCidadeEndereco("")
      setEstado("")
    }

    const digits = formatted.replace(/\D/g, "")
    if (digits.length === 8) {
      setLoadingCep(true)
      try {
        const response = await fetch(`/api/cep?cep=${digits}`)
        const data = await response.json()

        if (data.error) {
          toast.error("CEP não encontrado")
          return
        }

        // ── City validation ──────────────────────────────────────────
        const returnedCity: string = data.cidade || ""
        if (cidade && normalizeName(returnedCity) !== normalizeName(cidade)) {
          setCityMismatch(returnedCity)
          // Still fill address fields so user can see what was found
          setLogradouro(data.logradouro || "")
          setBairroCep(data.bairro || "")
          setCidadeEndereco(data.cidade || "")
          setEstado(data.uf || "")
          if (data.complemento) setComplemento(data.complemento)
          return
        }
        // ────────────────────────────────────────────────────────────

        setLogradouro(data.logradouro || "")
        setBairroCep(data.bairro || "")
        setCidadeEndereco(data.cidade || "")
        setEstado(data.uf || "")
        if (data.complemento) setComplemento(data.complemento)

        toast.success(`Endereço encontrado: ${data.logradouro}, ${data.bairro}`)

        setTimeout(() => {
          document.getElementById("numero")?.focus()
        }, 100)
      } catch {
        toast.error("Erro ao buscar CEP")
      } finally {
        setLoadingCep(false)
      }
    }
  }

  return (
    <div>
      <CardHeader
        icon={MapPin}
        badge="Endereço"
        title="Endereço de Instalação"
        description="Informe o endereço onde a internet será instalada"
      />

      <div className="p-6 md:p-8">
        {/* CEP e Endereço */}
        <div className="mb-8">
          <SectionTitle>CEP e Endereço</SectionTitle>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 max-w-[200px]">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                CEP <span className="text-primary text-[0.9em]">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={cep}
                  onChange={(e) => handleCepChange(e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                  className={inputClass(errors.cep || !!cityMismatch)}
                />
                {loadingCep && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                    <div className="w-[18px] h-[18px] border-2 border-border border-t-primary rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {errors.cep && (
                <span className="text-xs font-medium text-destructive">CEP inválido</span>
              )}
            </div>

            {/* City mismatch warning */}
            {cityMismatch && (
              <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/10">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-[13px] font-semibold text-amber-700 dark:text-amber-400">
                    CEP fora da área de cobertura
                  </p>
                  <p className="text-[12px] text-amber-600 dark:text-amber-500 mt-0.5 leading-relaxed">
                    Este CEP pertence a <strong>{cityMismatch}</strong>, mas você selecionou{" "}
                    <strong>{cidade}</strong> no primeiro passo. Use um CEP de{" "}
                    <strong>{cidade}</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-[1fr_auto] md:grid-cols-[3fr_1fr] gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                  Rua / Logradouro <span className="text-primary text-[0.9em]">*</span>
                </label>
                <input
                  type="text"
                  value={logradouro}
                  onChange={(e) => setLogradouro(e.target.value)}
                  placeholder="Nome da rua"
                  className={inputClass(errors.logradouro)}
                />
                {errors.logradouro && (
                  <span className="text-xs font-medium text-destructive">Rua é obrigatória</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                  Número <span className="text-primary text-[0.9em]">*</span>
                </label>
                <input
                  id="numero"
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="Nº"
                  className={inputClass(errors.numero)}
                />
                {errors.numero && (
                  <span className="text-xs font-medium text-destructive">Obrigatório</span>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground">
                  Complemento
                </label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, bloco, etc."
                  className={inputClass(false)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground">
                  Bairro (endereço)
                </label>
                <input
                  type="text"
                  value={bairroCep}
                  readOnly
                  placeholder="Preenchido pelo CEP"
                  className={inputClass(false, true)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                  Cidade <span className="text-primary text-[0.9em]">*</span>
                </label>
                <input
                  type="text"
                  value={cidadeEndereco}
                  readOnly
                  placeholder="Preenchido pelo CEP"
                  className={inputClass(errors.cidadeEndereco, true)}
                />
                {errors.cidadeEndereco && (
                  <span className="text-xs font-medium text-destructive">Cidade é obrigatória</span>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                  Estado <span className="text-primary text-[0.9em]">*</span>
                </label>
                <input
                  type="text"
                  value={estado}
                  readOnly
                  placeholder="UF"
                  className={inputClass(errors.estado, true)}
                />
                {errors.estado && (
                  <span className="text-xs font-medium text-destructive">Estado é obrigatório</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Referência */}
        <div className="mb-0">
          <SectionTitle>Referência</SectionTitle>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
              Ponto de Referência <span className="text-primary text-[0.9em]">*</span>
            </label>
            <textarea
              value={pontoReferencia}
              onChange={(e) => setPontoReferencia(e.target.value)}
              placeholder="Ex: Próximo ao supermercado, em frente à praça, portão azul..."
              className={cn(
                "w-full min-h-[90px] p-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none resize-y leading-relaxed",
                "placeholder:text-muted-foreground placeholder:text-sm",
                "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
                errors.pontoReferencia && "border-destructive"
              )}
            />
            {errors.pontoReferencia && (
              <span className="text-xs font-medium text-destructive">
                Ponto de referência é obrigatório (mín. 3 caracteres)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-muted border-t border-border flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="h-[54px] px-6 bg-transparent text-foreground border-[1.5px] border-border rounded-xl font-heading text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            Voltar
          </button>
          <button
            onClick={onSubmit}
            disabled={isSubmitting || !!cityMismatch}
            className="flex-1 h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(249,115,22,0.4)] active:translate-y-0 disabled:opacity-65 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin-slow" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Enviar Pré-Cadastro
              </>
            )}
          </button>
        </div>
        <div className="text-center text-[13px] text-muted-foreground flex items-center justify-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          Seus dados são protegidos e usados apenas para o cadastro
        </div>
      </div>
    </div>
  )
}
