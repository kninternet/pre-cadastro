"use client"

import { CheckCircle2, ArrowLeft, Send, Loader2, Edit2, Check } from "lucide-react"

interface ReviewStepProps {
  // Step 1
  nome: string
  email: string
  whatsapp: string
  // Step 2
  cidade: string
  bairro: string
  plano: string
  vencimento: string
  cpf: string
  aceitaTaxaInstalacao: boolean
  // Step 3
  logradouro: string
  numero: string
  complemento: string
  bairroCep: string
  cidadeEndereco: string
  estado: string
  cep: string
  pontoReferencia: string
  // Actions
  onConfirm: () => Promise<void>
  onBack: () => void
  onEditStep: (step: number) => void
  isSubmitting: boolean
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <div className="flex justify-between items-start gap-4 py-2.5 border-b border-border last:border-0">
      <span className="text-[13px] text-muted-foreground min-w-[120px]">{label}</span>
      <span className="text-[13px] font-semibold text-foreground text-right">{value}</span>
    </div>
  )
}

function Section({
  title, step, onEdit, children,
}: {
  title: string
  step: number
  onEdit: (step: number) => void
  children: React.ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-bold uppercase tracking-wider" style={{ color: "var(--primary)" }}>
          {title}
        </h3>
        <button
          onClick={() => onEdit(step)}
          className="flex items-center gap-1 text-[12px] font-semibold transition-all"
          style={{ color: "var(--muted-foreground)" }}
        >
          <Edit2 className="w-3 h-3" />
          Editar
        </button>
      </div>
      <div className="bg-card border border-border rounded-xl px-4 py-1">
        {children}
      </div>
    </div>
  )
}

export function ReviewStep({
  nome, email, whatsapp,
  cidade, bairro, plano, vencimento, cpf, aceitaTaxaInstalacao,
  logradouro, numero, complemento, bairroCep, cidadeEndereco, estado, cep, pontoReferencia,
  onConfirm, onBack, onEditStep, isSubmitting,
}: ReviewStepProps) {
  const enderecoCompleto = [logradouro, numero, complemento].filter(Boolean).join(", ")
  const cpfFormatado = cpf.length === 11 ? `${cpf.slice(0,3)}.***.***-${cpf.slice(9)}` : cpf
  const whatsappFormatado = whatsapp.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
  const cepFormatado = cep.replace(/(\d{5})(\d{3})/, "$1-$2")

  return (
    <div>
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
            <CheckCircle2 className="w-5 h-5" style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h2 className="font-heading text-[18px] font-extrabold" style={{ color: "var(--foreground)" }}>
              Revise seus dados
            </h2>
            <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
              Confirme as informações antes de enviar
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8">
        {/* Dados pessoais */}
        <Section title="Dados pessoais" step={1} onEdit={onEditStep}>
          <Row label="Nome" value={nome} />
          <Row label="E-mail" value={email} />
          <Row label="WhatsApp" value={whatsappFormatado} />
          <Row label="CPF" value={cpfFormatado} />
        </Section>

        {/* Plano */}
        <Section title="Plano contratado" step={2} onEdit={onEditStep}>
          <Row label="Cidade" value={cidade} />
          <Row label="Bairro" value={bairro} />
          <Row label="Plano" value={plano} />
          <Row label="Vencimento" value={`Todo dia ${vencimento}`} />
          {aceitaTaxaInstalacao && (
            <div className="flex justify-between items-center py-2.5">
              <span className="text-[13px] text-muted-foreground">Taxa de instalação</span>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-foreground">
                <Check className="w-3.5 h-3.5 text-green-500" />
                R$ 150,00 via Pix
              </span>
            </div>
          )}
        </Section>

        {/* Endereço */}
        <Section title="Endereço de instalação" step={3} onEdit={onEditStep}>
          <Row label="Endereço" value={enderecoCompleto} />
          <Row label="Bairro" value={bairroCep} />
          <Row label="Cidade/UF" value={`${cidadeEndereco} - ${estado}`} />
          <Row label="CEP" value={cepFormatado} />
          <Row label="Referência" value={pontoReferencia} />
        </Section>
      </div>

      {/* Footer */}
      <div className="p-6 bg-muted border-t border-border flex flex-col gap-3">
        <div className="flex gap-3">
          <button
            onClick={onBack}
            disabled={isSubmitting}
            className="h-[54px] px-6 bg-transparent text-foreground border-[1.5px] border-border rounded-xl font-heading text-[15px] font-bold cursor-pointer flex items-center justify-center gap-2 transition-all hover:bg-foreground/5 disabled:opacity-50"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            Voltar
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className="flex-1 h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] hover:-translate-y-0.5 disabled:opacity-65 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Enviando...</>
            ) : (
              <><Send className="w-5 h-5" />Confirmar e Enviar</>
            )}
          </button>
        </div>
        <p className="text-center text-[12px]" style={{ color: "var(--muted-foreground)" }}>
          Ao confirmar, seus dados serão enviados para análise da KN Internet
        </p>
      </div>
    </div>
  )
}