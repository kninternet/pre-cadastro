"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Lock, RefreshCw } from "lucide-react"

const PIN_CORRETO = process.env.NEXT_PUBLIC_ATENDIMENTO_PIN ?? ""

interface Lead {
  id: number
  nome: string
  whatsapp: string
  email: string
  cidade_cobertura: string | null
  bairro_cobertura: string | null
  plano_velocidade: string | null
  step_atual: number
  status_recuperacao: string | null
  created_at: string
}

const STATUS_OPTIONS = [
  { value: '', label: 'Sem ação' },
  { value: 'convertido', label: '✅ Convertido' },
  { value: 'duplicado', label: '🔁 Duplicado' },
  { value: 'perdido', label: '❌ Perdido' },
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function PipelinePage() {
  const [pin, setPin] = useState("")
  const [autenticado, setAutenticado] = useState(false)
  const [erro, setErro] = useState(false)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(false)

  const fetchLeads = useCallback(async () => {
    setLoading(true)
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      const res = await fetch(`${basePath}/api/atendimento/status-lead`)
      const data = await res.json()
      setLeads(data.leads ?? [])
    } catch {
      // silencioso — tenta de novo no próximo refresh manual
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (autenticado) fetchLeads()
  }, [autenticado, fetchLeads])

  const handlePin = (value: string) => {
    const clean = value.replace(/\D/g, "").slice(0, 4)
    setPin(clean)
    setErro(false)
    if (clean.length === 4) {
      if (clean === PIN_CORRETO) {
        setAutenticado(true)
      } else {
        setErro(true)
        setTimeout(() => setPin(""), 800)
      }
    }
  }

  const updateStatus = async (id: number, status: string) => {
    // Atualização otimista — reflete na tela antes da resposta do servidor
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status_recuperacao: status || null } : l))
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      await fetch(`${basePath}/api/atendimento/status-lead`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
    } catch {
      fetchLeads() // reverte buscando o estado real em caso de erro
    }
  }

  if (!autenticado) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "var(--background)" }}>
        <div className="page-bg"><div className="dot-grid" /></div>
        <div className="relative z-10 w-full max-w-[360px]">
          <div className="flex flex-col items-center mb-8">
            <Image src="/logo-kn-internet.jpeg" alt="KN Internet" width={140} height={84} className="object-contain mb-4" priority />
            <span className="text-[12px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full"
              style={{ background: "rgba(249,115,22,0.1)", color: "var(--primary)" }}>
              Recuperação de Carrinho
            </span>
          </div>

          <div className="bg-card rounded-2xl shadow-xl border border-border p-8 flex flex-col items-center gap-5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
              <Lock className="w-6 h-6" style={{ color: "var(--primary)" }} />
            </div>
            <div className="text-center">
              <h2 className="font-heading text-[18px] font-extrabold mb-1" style={{ color: "var(--foreground)" }}>Acesso restrito</h2>
              <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>Digite o PIN para continuar</p>
            </div>

            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={e => handlePin(e.target.value)}
              placeholder="• • • •"
              autoFocus
              className="w-full h-[54px] text-center text-[24px] tracking-[0.5em] font-bold rounded-xl border-[1.5px] outline-none transition-all"
              style={{
                background: "var(--input)",
                borderColor: erro ? "var(--destructive)" : pin.length === 4 ? "var(--primary)" : "var(--border)",
                color: "var(--foreground)",
              }}
            />
            {erro && <p className="text-[13px] font-medium" style={{ color: "var(--destructive)" }}>PIN incorreto</p>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative z-10 min-h-screen px-4 py-8 pb-16">
      <div className="page-bg"><div className="dot-grid" /></div>
      <header className="max-w-[1100px] mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Image src="/logo-kn-internet.jpeg" alt="KN Internet" width={100} height={60} className="object-contain" />
          <div>
            <h1 className="font-heading text-[20px] font-extrabold" style={{ color: "var(--foreground)" }}>Recuperação de Carrinho</h1>
            <p className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>{leads.length} oportunidades</p>
          </div>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="h-[40px] px-4 rounded-lg border-[1.5px] border-border flex items-center gap-2 text-[13px] font-semibold transition-all hover:bg-muted"
          style={{ color: "var(--foreground)" }}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </header>

      <div className="max-w-[1100px] mx-auto bg-card rounded-2xl border border-border shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr style={{ background: "var(--secondary)" }}>
                <th className="px-4 py-3 text-left text-white text-[12px] font-semibold uppercase">Data</th>
                <th className="px-4 py-3 text-left text-white text-[12px] font-semibold uppercase">Nome</th>
                <th className="px-4 py-3 text-left text-white text-[12px] font-semibold uppercase">WhatsApp</th>
                <th className="px-4 py-3 text-left text-white text-[12px] font-semibold uppercase">Cidade/Bairro</th>
                <th className="px-4 py-3 text-left text-white text-[12px] font-semibold uppercase">Plano</th>
                <th className="px-4 py-3 text-left text-white text-[12px] font-semibold uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const semAcao = !lead.status_recuperacao
                return (
                  <tr
                    key={lead.id}
                    className="border-t border-border transition-colors hover:bg-muted/40"
                    style={{ fontWeight: semAcao ? 700 : 400 }}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3">{lead.nome}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href={`https://wa.me/55${lead.whatsapp}`} target="_blank" rel="noopener noreferrer"
                        className="hover:underline" style={{ color: "var(--primary)" }}>
                        {lead.whatsapp}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.cidade_cobertura && lead.bairro_cobertura
                        ? `${lead.bairro_cobertura}, ${lead.cidade_cobertura}`
                        : <span style={{ color: "var(--muted-foreground)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {lead.plano_velocidade || <span style={{ color: "var(--muted-foreground)" }}>—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={lead.status_recuperacao ?? ''}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className="h-[36px] px-2 rounded-lg border-[1.5px] border-border text-[13px] font-semibold outline-none cursor-pointer"
                        style={{ background: "var(--input)", color: "var(--foreground)" }}
                      >
                        {STATUS_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                )
              })}
              {leads.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center" style={{ color: "var(--muted-foreground)" }}>
                    Nenhuma oportunidade encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}