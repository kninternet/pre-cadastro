"use client"

import { useState } from "react"
import { Users, ArrowRight, ArrowLeft, ChevronDown } from "lucide-react"
import { CardHeader } from "./card-header"
import { SectionTitle } from "./section-title"
import { cn } from "@/lib/utils"
import { formatCPF, formatPhone } from "@/lib/formatters"

export interface IndicacaoData {
  indicador_nome: string
  indicador_primeiro_nome: string
  indicador_tipo: string
  indicador_valor: string
  indicador_cpf: string
  indicador_cliente_id: number | null
  indicador_validado: boolean
}

interface StepIndicacaoProps {
  indicacao: IndicacaoData
  setIndicacao: (data: IndicacaoData) => void
  errors: Record<string, boolean>
  onNext: () => void
  onBack: () => void
}

function normalizeName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function namesMatch(typed: string, fromSgp: string): boolean {
  const t = normalizeName(typed)
  const s = normalizeName(fromSgp)
  // Match exato
  if (t === s) return true
  // Match pelo primeiro nome
  const tFirst = t.split(' ')[0]
  const sFirst = s.split(' ')[0]
  if (tFirst === sFirst) return true
  // Typed contém o primeiro nome do SGP ou vice-versa
  if (s.includes(tFirst) || t.includes(sFirst)) return true
  return false
}

export function StepIndicacao({
  indicacao, setIndicacao,
  errors,
  onNext, onBack,
}: StepIndicacaoProps) {
  const [nomeIndicador, setNomeIndicador] = useState(indicacao.indicador_nome || '')
  const [tipo, setTipo] = useState(indicacao.indicador_tipo || '')
  const [valor, setValor] = useState(indicacao.indicador_valor || '')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')

  const inputClass = (hasError: boolean) =>
    cn(
      "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none",
      "placeholder:text-muted-foreground placeholder:text-sm",
      "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
      hasError && "border-destructive"
    )

  const tipoOptions = [
    { value: 'cpf', label: 'CPF' },
    { value: 'email', label: 'E-mail' },
    { value: 'telefone', label: 'Telefone / WhatsApp' },
  ]

  function getPlaceholder() {
    if (tipo === 'cpf') return '000.000.000-00'
    if (tipo === 'email') return 'email@exemplo.com'
    if (tipo === 'telefone') return '(21) 99999-9999'
    return ''
  }

  function getLabel() {
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
    if (!nomeIndicador.trim()) {
      setApiError('Informe o nome de quem te indicou')
      return
    }
    if (!tipo) {
      setApiError('Selecione como identificar o indicador')
      return
    }
    if (!valor.trim()) {
      setApiError('Preencha o dado do indicador')
      return
    }

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

      if (!data.found) {
        setApiError(data.message || 'Não encontramos esse cadastro na nossa base.')
        return
      }

      // Compara o nome digitado com o nome retornado pelo SGP
      const nomeCompleto = data.nome_completo || data.primeiro_nome || ''
      if (!namesMatch(nomeIndicador, nomeCompleto)) {
        setApiError('O nome informado não confere com o cadastro encontrado. Verifique e tente novamente.')
        return
      }

      // Match — segue
      setIndicacao({
        indicador_nome: nomeIndicador.trim(),
        indicador_primeiro_nome: data.primeiro_nome,
        indicador_tipo: tipo,
        indicador_valor: valor,
        indicador_cpf: data.cpf || '',
        indicador_cliente_id: data.cliente_id,
        indicador_validado: true,
      })
      onNext()
    } catch {
      setApiError('Erro ao consultar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

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

            {/* Nome do indicador */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                Nome de quem te indicou <span className="text-primary text-[0.9em]">*</span>
              </label>
              <input
                type="text"
                value={nomeIndicador}
                onChange={(e) => { setNomeIndicador(e.target.value); setApiError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder="Nome completo de quem te indicou"
                autoComplete="off"
                className={inputClass(errors.indicador_nome)}
              />
              {errors.indicador_nome && (
                <span className="text-xs font-medium text-destructive">Informe o nome do indicador</span>
              )}
            </div>

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
                  <option value="" disabled>Selecione: CPF, E-mail ou WhatsApp</option>
                  {tipoOptions.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
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
                  autoComplete="off"
                  className={inputClass(!!apiError)}
                />
              </div>
            )}

            {apiError && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-destructive">{apiError}</p>
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
          disabled={loading}
          className="flex-1 h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
