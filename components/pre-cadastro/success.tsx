"use client"

import { CheckCircle2 } from "lucide-react"

interface SuccessProps {
  vencimento: string
  onReset: () => void
}

export function Success({ vencimento, onReset }: SuccessProps) {
  return (
    <div className="flex flex-col items-center text-center p-8 md:p-12">
      <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
        <CheckCircle2 className="w-11 h-11 text-success" />
      </div>
      <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2.5">
        Pré-Cadastro Realizado!
      </h2>
      <p className="text-[15px] text-muted-foreground max-w-[360px] leading-relaxed">
        Obrigado por escolher a KN Internet! Em breve nossa equipe entrará em contato pelo WhatsApp informado.
      </p>
      <div className="mt-5 bg-muted border border-border rounded-xl px-5 py-3.5 text-sm text-foreground w-full max-w-[340px]">
        📅 Vencimento: todo dia <strong className="text-primary">{vencimento}</strong> de cada mês
      </div>
      <button
        onClick={onReset}
        className="mt-7 px-8 py-3 bg-transparent border-[1.5px] border-secondary rounded-xl font-heading text-[15px] font-bold text-secondary cursor-pointer transition-all hover:bg-secondary hover:text-white"
      >
        Fazer novo cadastro
      </button>
    </div>
  )
}
