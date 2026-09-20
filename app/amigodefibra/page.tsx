"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { Users } from "lucide-react"
import { PreCadastroForm } from "@/components/pre-cadastro/pre-cadastro-form"

const MGM_STORAGE_KEY = "kn_mgm_indicador"

function MgmWelcomeModal({ onClose }: { onClose: (data: { visitante: string; indicador: string }) => void }) {
  const [open, setOpen] = useState(false)
  const [visitante, setVisitante] = useState("")
  const [indicador, setIndicador] = useState("")

  useEffect(() => {
    const saved = sessionStorage.getItem(MGM_STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        onClose(data)
      } catch {
        setOpen(true)
      }
    } else {
      const t = setTimeout(() => setOpen(true), 400)
      return () => clearTimeout(t)
    }
  }, [onClose])

  const handleContinue = useCallback(() => {
    if (!visitante.trim()) return
    const data = { visitante: visitante.trim(), indicador: indicador.trim() }
    sessionStorage.setItem(MGM_STORAGE_KEY, JSON.stringify(data))
    setOpen(false)
    onClose(data)
  }, [visitante, indicador, onClose])

  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === "Enter" && visitante.trim()) handleContinue() }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [open, handleContinue, visitante])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="relative w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}
      >
        <div className="px-6 py-5 flex flex-col items-center text-center gap-3" style={{ background: "var(--secondary)" }}>
          <Image
            src="/logo-kn-internet.jpeg"
            alt="KN Internet"
            width={140}
            height={80}
            className="object-contain"
            priority
          />
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider text-white"
            style={{ background: "var(--primary)" }}
          >
            PROGRAMA DE INDICAÇÃO
          </div>
          <h2 className="font-heading text-[22px] font-extrabold text-white">
            Amigo de Fibra
          </h2>
          <p className="text-[14px] leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
            Que bom que você está aqui! Este é o Programa de Indicação da KN Internet.
          </p>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground">Qual o seu nome?</label>
            <input
              type="text"
              value={visitante}
              onChange={(e) => setVisitante(e.target.value)}
              placeholder="Seu primeiro nome"
              autoFocus
              autoComplete="given-name"
              className="w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              Quem te indicou?
            </label>
            <input
              type="text"
              value={indicador}
              onChange={(e) => setIndicador(e.target.value)}
              placeholder="Nome de quem te indicou"
              autoComplete="off"
              className="w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]"
            />
          </div>
          <button
            onClick={handleContinue}
            disabled={!visitante.trim()}
            className="w-full h-[50px] rounded-xl font-heading text-[16px] font-bold text-white border-none cursor-pointer transition-all hover:bg-[#ea6c0a] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--primary)", boxShadow: "0 4px 16px rgba(249,115,22,0.3)" }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

function FormHeader({ indicadorNome }: { indicadorNome?: string }) {
  return (
    <div className="flex flex-col items-center text-center gap-2.5 mb-3">
      <Image
        src="/logo-kn-internet.jpeg"
        alt="KN Internet"
        width={130}
        height={75}
        className="object-contain drop-shadow-lg"
        priority
      />
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider text-white bg-primary/90 backdrop-blur-sm shadow-lg">
        AMIGO DE FIBRA
      </div>
      {indicadorNome && (
        <p className="text-[13px] text-white/70 font-medium flex items-center gap-1.5">
          🤝 Indicado por <strong className="text-white">{indicadorNome}</strong>
        </p>
      )}
    </div>
  )
}

export default function AmigoFibraPage() {
  const [modalData, setModalData] = useState<{ visitante: string; indicador: string } | null>(null)
  const [showForm, setShowForm] = useState(false)

  function handleModalClose(data: { visitante: string; indicador: string }) {
    setModalData(data)
    setShowForm(true)
  }

  return (
    <>
      {/* ── Background fixo ──────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0" aria-hidden="true">
        {/* Desktop: imagem espelhada (personagens à direita via object-position) */}
        <Image
          src="/hero-amigo-desktop.jpg"
          alt=""
          fill
          priority
          className="object-cover hidden md:block"
          sizes="100vw"
          quality={85}
          style={{ objectPosition: "right center", transform: "scaleX(-1)" }}
        />
        {/* Mobile */}
        <Image
          src="/hero-amigo-mobile.jpg"
          alt=""
          fill
          priority
          className="object-cover object-top block md:hidden"
          sizes="100vw"
          quality={85}
          style={{ transform: "scaleX(-1)" }}
        />
        {/* Mobile overlay */}
        <div
          className="absolute inset-0 block md:hidden"
          style={{
            background: "linear-gradient(to bottom, rgba(0,20,40,0.25) 0%, rgba(0,20,40,0.5) 35%, rgba(0,15,30,0.88) 70%, rgba(0,10,25,0.96) 100%)",
          }}
        />
        {/* Desktop overlay: gradiente da esquerda (form) pra direita (foto respira) */}
        <div
          className="absolute inset-0 hidden md:block"
          style={{
            background: [
              "linear-gradient(to left, rgba(0,15,30,0.1) 0%, rgba(0,15,30,0.25) 35%, rgba(0,12,25,0.75) 55%, rgba(0,10,22,0.93) 75%, rgba(0,8,20,0.97) 100%)",
              "linear-gradient(to bottom, rgba(0,20,40,0.15) 0%, rgba(0,15,30,0.25) 100%)",
            ].join(", "),
          }}
        />
      </div>

      {/* ── Headline desktop: topo esquerdo sobre a foto ─────────────── */}
      <div className="fixed top-8 right-10 z-[5] hidden md:block max-w-[380px] text-right">
        <h1 className="font-heading text-[28px] lg:text-[34px] font-extrabold text-white leading-tight drop-shadow-md">
          Indique um amigo e ganhe 1 mês grátis.
        </h1>
        <p className="mt-2 text-[14px] text-white/55 leading-relaxed">
          Seu amigo se conecta com a melhor fibra e você ganha um mês de internet por nossa conta.
        </p>
      </div>

      {/* ── Layout ────────────────────────────────────────────────────── */}
      <div className="relative z-10 min-h-screen flex flex-col md:flex-row">

        {/* Coluna esquerda — form */}
        <div className="flex-1 md:w-[55%] lg:w-[50%] flex flex-col items-center px-4 py-6 pb-16 md:py-5 md:overflow-y-auto md:max-h-screen">
          <FormHeader indicadorNome={modalData?.indicador} />

          {!showForm && <MgmWelcomeModal onClose={handleModalClose} />}

          {showForm && (
            <Suspense
              fallback={
                <div className="w-full max-w-[520px] bg-card/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/10 overflow-hidden p-8 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
                </div>
              }
            >
              <PreCadastroForm
                mgm
                mgmVisitanteNome={modalData?.visitante}
                mgmIndicadorNome={modalData?.indicador}
              />
            </Suspense>
          )}

          <footer className="mt-6 text-center text-[12px] text-white/40">
            © {new Date().getFullYear()} KN Internet · Todos os direitos reservados ·{" "}
            <a
              href="https://wa.me/5521967797580"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary font-medium hover:underline"
            >
              Fale conosco
            </a>
          </footer>
        </div>

        {/* Coluna direita — desktop only: foto respira */}
        <div className="hidden md:block md:w-[45%] lg:w-[50%]" />
      </div>
    </>
  )
}
