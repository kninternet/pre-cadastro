import { Suspense } from "react"
import Image from "next/image"
import { AtendimentoForm } from "@/components/atendimento/atendimento-form"

function Header() {
  return (
    <header className="w-full max-w-[780px] flex flex-col items-center justify-center py-6 pb-8 text-center gap-3">
      <Image
        src="/logo-kn-internet.jpeg"
        alt="KN Internet"
        width={160}
        height={96}
        className="object-contain"
        priority
      />
      <div className="flex flex-col items-center gap-1">
        <p className="text-[15px] text-foreground/50 font-medium">Fibra Óptica no Rio de Janeiro</p>
        <span className="text-[12px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full" 
          style={{ background: "rgba(249,115,22,0.1)", color: "var(--primary)" }}>
          Formulário de Atendimento
        </span>
      </div>
    </header>
  )
}

export default function AtendimentoPage() {
  return (
    <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 pb-16">
      <div className="page-bg"><div className="dot-grid" /></div>
      <Header />
      <Suspense fallback={
        <div className="w-full max-w-[780px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden p-8 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
        </div>
      }>
        <AtendimentoForm />
      </Suspense>
    </div>
  )
}
