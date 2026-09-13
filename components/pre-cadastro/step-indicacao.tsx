"use client"

import { useState } from "react"
import { Users, ArrowRight, ArrowLeft, Search, ChevronDown } from "lucide-react"
import { CardHeader } from "./card-header"
import { SectionTitle } from "./section-title"
import { cn } from "@/lib/utils"
import { formatCPF, formatPhone } from "@/lib/formatters"

export interface IndicacaoData {
  indicador_nome: string
  indicador_primeiro_nome: string
  indicador_tipo: string        // 'nome' | 'cpf' | 'email' | 'telefone'
  indicador_valor: string       // valor digitado
  indicador_cpf: string         // CPF retornado pelo SGP (vazio se tipo=nome)
  indicador_cliente_id: number | null
  indicador_validado: boolean   // true se passou pelo quiz
}

interface StepIndicacaoProps {
  indicacao: IndicacaoData
  setIndicacao: (data: IndicacaoData) => void
  errors: Record<string, boolean>
  onNext: () => void
  onBack: () => void
}

const EMPTY_INDICACAO: IndicacaoData = {
  indicador_nome: '',
  indicador_primeiro_nome: '',
  indicador_tipo: '',
  indicador_valor: '',
  indicador_cpf: '',
  indicador_cliente_id: null,
  indicador_validado: false,
}

export function StepIndicacao({
  indicacao, setIndicacao,
  errors,
  onNext, onBack,
}: StepIndicacaoProps) {
  const [tipo, setTipo] = useState(indicacao.indicador_tipo || '')
  const [valor, setValor] = useState(indicacao.indicador_valor || '')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  // Quiz state
  const [quizStep, setQuizStep] = useState(false)
  const [quizOptions, setQuizOptions] = useState<string[]>([])
  const [quizSelected, setQuizSelected] = useState<string | null>(null)
  const [quizAttempts, setQuizAttempts] = useState(0)
  const [quizStatus, setQuizStatus] = useState<null | 'correct' | 'wrong' | 'blocked'>(null)
  const [referrer, setReferrer] = useState<{ primeiro_nome: string; cliente_id: number | null; cpf: string } | null>(null)

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none",
      "placeholder:text-muted-foreground placeholder:text-sm",
      "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
      hasError && "border-destructive"
    )

  const tipoOptions = [
    { value: 'nome', label: 'Nome Completo' },
    { value: 'cpf', label: 'CPF' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone / WhatsApp' },
  ]

  function getPlaceholder() {
    if (tipo === 'nome') return 'Nome completo de quem te indicou'
    if (tipo === 'cpf') return '000.000.000-00'
    if (tipo === 'email') return 'email@exemplo.com'
    if (tipo === 'telefone') return '(21) 99999-9999'
    return ''
  }

  function getLabel() {
    if (tipo === 'nome') return 'Nome completo do indicador'
    if (tipo === 'cpf') return 'CPF do indicador'
    if (tipo === 'email') return 'E-mail do indicador'
    if (tipo === 'telefone') return 'Telefone do indicador'
    return 'Dado do indicador'
  }

  function handleValorChange(val: string) {
    if (tipo === 'cpf') val = formatCPF(val)
    if (tipo === 'telefone') val = formatPhone(val)
    setValor(val)
    setApiError('')
  }

  async function handleSearch() {
    if (!tipo || !valor.trim()) return

    // Nome completo — sem validação, segue direto
    if (tipo === 'nome') {
      setIndicacao({
        indicador_nome: valor.trim(),
        indicador_primeiro_nome: valor.trim().split(' ')[0],
        indicador_tipo: 'nome',
        indicador_valor: valor.trim(),
        indicador_cpf: '',
        indicador_cliente_id: null,
        indicador_validado: false,
      })
      onNext()
      return
    }

    // CPF/Email/Telefone — valida no SGP
    setLoading(true)
    setApiError('')

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/mgm/validar-indicador`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo,
          valor: tipo === 'cpf' ? valor.replace(/\D/g, '') : tipo === 'telefone' ? valor.replace(/\D/g, '') : valor.trim(),
        }),
      })
      const data = await res.json()

      if (data.found) {
        setReferrer({
          primeiro_nome: data.primeiro_nome,
          cliente_id: data.cliente_id,
          cpf: data.cpf || '',
        })
        setQuizOptions(data.quiz_options)
        setQuizStep(true)
        setQuizSelected(null)
        setQuizAttempts(0)
        setQuizStatus(null)
      } else {
        setApiError(data.message || 'Não encontramos esse cadastro.')
      }
    } catch {
      setApiError('Erro ao consultar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  function handleQuizConfirm() {
    if (!quizSelected || !referrer) return

    if (quizSelected === referrer.primeiro_nome) {
      setQuizStatus('correct')
      setTimeout(() => {
        setIndicacao({
          indicador_nome: referrer.primeiro_nome,
          indicador_primeiro_nome: referrer.primeiro_nome,
          indicador_tipo: tipo,
          indicador_valor: valor,
          indicador_cpf: referrer.cpf,
          indicador_cliente_id: referrer.cliente_id,
          indicador_validado: true,
        })
        onNext()
      }, 1200)
    } else {
      const next = quizAttempts + 1
      setQuizAttempts(next)
      if (next >= 2) {
        setQuizStatus('blocked')
      } else {
        setQuizStatus('wrong')
        setQuizSelected(null)
        setTimeout(() => {
          // Regenerate quiz — call API again for new options
          handleSearch()
        }, 1500)
      }
    }
  }

  function handleQuizRetry() {
    setQuizStep(false)
    setReferrer(null)
    setQuizOptions([])
    setQuizSelected(null)
    setQuizAttempts(0)
    setQuizStatus(null)
    setValor('')
    setTipo('')
  }

  function handleRefreshOptions() {
    // Re-fetch to get new quiz options
    setQuizSelected(null)
    setQuizStatus(null)
    handleSearch()
  }

  // ── QUIZ VIEW ──────────────────────────────────────────────────────────────
  if (quizStep && referrer) {
    return (
      <div>
        <CardHeader
          icon={Users}
          badge="Indicação"
          title="Confirme quem te indicou"
          description="Encontramos o cadastro. Qual o primeiro nome de quem te indicou?"
        />

        <div className="p-6 md:p-8">
          <div className="flex flex-col gap-2 mb-5">
            {quizOptions.map((name) => {
              const isSel = quizSelected === name
              const isOk = quizStatus === 'correct' && name === referrer.primeiro_nome
              const isWrong = quizStatus === 'wrong' && isSel

              return (
                <button
                  key={name}
                  onClick={() => quizStatus !== 'correct' && quizStatus !== 'blocked' && setQuizSelected(name)}
                  disabled={quizStatus === 'correct' || quizStatus === 'blocked'}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg border-[1.5px] text-[15px] font-medium transition-all text-left",
                    isOk && "bg-green-50 border-green-400 text-green-800",
                    isWrong && "bg-red-50 border-destructive text-red-800",
                    !isOk && !isWrong && isSel && "bg-primary/5 border-primary text-foreground",
                    !isOk && !isWrong && !isSel && "bg-card border-border text-foreground hover:border-muted-foreground",
                  )}
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                      (isSel || isOk) ? "border-primary bg-primary" : "border-border",
                    )}
                  >
                    {(isSel || isOk) && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  {name}
                  {isOk && <span className="ml-auto text-green-500 font-bold">✓</span>}
                  {isWrong && <span className="ml-auto text-destructive font-bold">✗</span>}
                </button>
              )
            })}
          </div>

          {quizStatus === 'blocked' ? (
            <div className="rounded-xl p-4 mb-4 bg-amber-50 border-l-4 border-amber-400">
              <p className="text-sm text-amber-800">
                Limite de tentativas atingido. Tente novamente em alguns minutos.
              </p>
              <button
                onClick={handleQuizRetry}
                className="mt-2 text-sm font-semibold underline text-primary"
              >
                Voltar e tentar outro dado
              </button>
            </div>
          ) : quizStatus === 'wrong' ? (
            <p className="text-sm text-destructive text-center mb-4">
              Nome incorreto. Trocamos as opções, tente novamente.
            </p>
          ) : quizStatus === 'correct' ? (
            <div className="flex items-center gap-2 justify-center py-3 rounded-xl bg-green-50 border border-green-200">
              <span className="text-base">🤝</span>
              <span className="text-sm font-semibold text-green-700">
                Indicado por {referrer.primeiro_nome}!
              </span>
            </div>
          ) : (
            <button
              onClick={handleQuizConfirm}
              disabled={!quizSelected}
              className="w-full h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
          )}

          {quizStatus !== 'blocked' && quizStatus !== 'correct' && (
            <button
              onClick={handleRefreshOptions}
              className="w-full py-2.5 mt-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Nenhum desses — trocar opções
            </button>
          )}
        </div>
      </div>
    )
  }

  // ── FORM VIEW ──────────────────────────────────────────────────────────────
  return (
    <div>
      <CardHeader
        icon={Users}
        badge="Indicação"
        title="Quem te indicou?"
        description="Informe os dados de quem te indicou para a KN Internet."
      />

      <div className="p-6 md:p-8">
        <div className="mb-6">
          <SectionTitle>Dados do indicador</SectionTitle>
          <div className="flex flex-col gap-4">

            {/* Tipo de identificação */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                Identificar por <span className="text-primary text-[0.9em]">*</span>
              </label>
              <div className="relative">
                <select
                  value={tipo}
                  onChange={(e) => { setTipo(e.target.value); setValor(''); setApiError('') }}
                  className={cn(
                    inputClass(errors.indicador_tipo),
                    "appearance-none cursor-pointer",
                    !tipo && "text-muted-foreground"
                  )}
                >
                  <option value="" disabled>Selecione como identificar</option>
                  {tipoOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {errors.indicador_tipo && (
                <span className="text-xs font-medium text-destructive">Selecione uma opção</span>
              )}
            </div>

            {/* Input do valor */}
            {tipo && (
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                  {getLabel()} <span className="text-primary text-[0.9em]">*</span>
                </label>
                <input
                  type={tipo === 'email' ? 'email' : 'text'}
                  value={valor}
                  onChange={(e) => handleValorChange(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                  placeholder={getPlaceholder()}
                  maxLength={tipo === 'cpf' ? 14 : tipo === 'telefone' ? 15 : undefined}
                  inputMode={tipo === 'cpf' || tipo === 'telefone' ? 'numeric' : undefined}
                  className={inputClass(!!apiError || errors.indicador_valor)}
                />
                {apiError && (
                  <span className="text-xs font-medium text-destructive">{apiError}</span>
                )}
                {errors.indicador_valor && !apiError && (
                  <span className="text-xs font-medium text-destructive">Preencha este campo</span>
                )}
                {tipo === 'nome' && (
                  <span className="text-xs text-muted-foreground">
                    Para indicação por nome, não é necessária validação.
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-muted border-t border-border flex gap-3">
        <button
          onClick={onBack}
          className="h-[54px] px-6 bg-transparent border-[1.5px] border-border rounded-xl font-heading text-[15px] font-bold text-muted-foreground cursor-pointer flex items-center gap-2 transition-all hover:border-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <button
          onClick={handleSearch}
          disabled={!tipo || !valor.trim() || loading}
          className="flex-1 h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              {tipo === 'nome' ? 'Continuar' : 'Verificar e continuar'}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
