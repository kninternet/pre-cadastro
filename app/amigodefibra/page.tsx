import { Suspense } from "react"
import Image from "next/image"
import { PreCadastroForm } from "@/components/pre-cadastro/pre-cadastro-form"

function Header() {
  return (
    <header className="w-full max-w-[680px] flex flex-col items-center justify-center py-6 pb-10 text-center gap-3">
      <Image
        src="/logo-kn-internet.jpeg"
        alt="KN Internet"
        width={200}
        height={120}
        className="object-contain"
        priority
      />
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wider text-white"
        style={{ background: 'var(--primary)' }}>
        AMIGO DE FIBRA
      </div>
      <p className="text-[15px] text-foreground/50 font-medium">
        Programa de Indicação · KN Internet
      </p>
    </header>
  )
}

function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="mt-8 text-center text-[13px] text-muted-foreground">
      © {year} KN Internet · Todos os direitos reservados ·{" "}
      <a
        href="https://wa.me/5521967797580"
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary font-medium hover:underline"
      >
        Fale conosco
      </a>
    </footer>
  )
}

function BackgroundDecoration() {
  return (
    <>
      <div className="page-bg">
        <div className="dot-grid" />
      </div>
      <svg
        className="fiber-deco"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,400 Q300,250 600,400 T1200,400" fill="none" stroke="url(#fg)" strokeWidth="2" />
        <path d="M0,500 Q300,350 600,500 T1200,500" fill="none" stroke="url(#fg)" strokeWidth="1.5" />
        <path d="M0,300 Q300,450 600,300 T1200,300" fill="none" stroke="url(#fg)" strokeWidth="1" />
      </svg>
    </>
  )
}

export default function AmigoFibraPage() {
  return (
    <>
      <BackgroundDecoration />
      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 pb-16">
        <Header />
        <Suspense
          fallback={
            <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden p-8 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
            </div>
          }
        >
          <PreCadastroForm mgm />
        </Suspense>
        <Footer />
      </div>
    </>
  )
}
