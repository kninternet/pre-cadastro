"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Send, Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatCPF, formatPhone, formatCEP, validateEmail, validateCPF, validatePhone, validateCEP } from "@/lib/formatters"
import { DATA } from "@/lib/data"

const inputClass = (hasError = false, readOnly = false) =>
  cn(
    "w-full h-[46px] px-3.5 bg-input border-[1.5px] border-border rounded-lg text-[15px] text-foreground transition-all outline-none",
    "placeholder:text-muted-foreground placeholder:text-sm",
    "hover:border-muted-foreground focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(249,115,22,0.12)]",
    readOnly && "bg-muted text-muted-foreground cursor-default",
    hasError && "border-destructive"
  )

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[13px] font-semibold text-foreground mb-1 block">
      {children} {required && <span style={{ color: "var(--primary)" }}>*</span>}
    </label>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest mb-4 mt-6 first:mt-0" style={{ color: "var(--primary)" }}>
      {children}
    </p>
  )
}

export function AtendimentoForm() {
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const [cpf, setCpf] = useState("")
  const [nome, setNome] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [email, setEmail] = useState("")

  const [cidade, setCidade] = useState("")
  const [bairro, setBairro] = useState("")
  const [plano, setPlano] = useState("")
  const [vencimento, setVencimento] = useState("")
  const [aceitaTaxa, setAceitaTaxa] = useState(false)

  const [cep, setCep] = useState("")
  const [logradouro, setLogradouro] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairroCep, setBairroCep] = useState("")
  const [cidadeEndereco, setCidadeEndereco] = useState("")
  const [estado, setEstado] = useState("")
  const [loadingCep, setLoadingCep] = useState(false)

  const [cpfDuplicado, setCpfDuplicado] = useState(false)
  const [cpfStatus, setCpfStatus] = useState<"idle"|"checking"|"ok"|"duplicate">("idle")

  const cidades = Object.keys(DATA)
  const bairros = cidade ? Object.keys(DATA[cidade]?.bairros ?? {}) : []
  const planos = (cidade && bairro) ? (DATA[cidade]?.bairros[bairro] ?? []) : []
  const vencimentos = cidade ? (DATA[cidade]?.vencimentos ?? []) : []

  useEffect(() => { setBairro(""); setPlano(""); setVencimento("") }, [cidade])
  useEffect(() => { setPlano("") }, [bairro])

  useEffect(() => {
    const n = searchParams.get("nome"); if (n) setNome(n)
    const w = searchParams.get("whatsapp"); if (w) setWhatsapp(formatPhone(w))
    const c = searchParams.get("cpf"); if (c) setCpf(formatCPF(c))
    const e = searchParams.get("email"); if (e) setEmail(e)
  }, [searchParams])

  const checkCpf = async (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length !== 11) return
    if (!validateCPF(value)) return
    setCpfStatus("checking")
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      const res = await fetch(`${basePath}/api/check-cpf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cpf: digits }),
      })
      const data = await res.json()
      if (data.found) {
        setCpfStatus("duplicate")
        setCpfDuplicado(true)
        toast.warning("CPF já cadastrado no SGP — lead será encaminhado ao atendimento")
      } else {
        setCpfStatus("ok")
        setCpfDuplicado(false)
      }
    } catch { setCpfStatus("idle") }
  }

  const handleCepChange = async (value: string) => {
    const formatted = formatCEP(value)
    setCep(formatted)
    const digits = formatted.replace(/\D/g, "")
    if (digits.length < 8) { setLogradouro(""); setBairroCep(""); setCidadeEndereco(""); setEstado(""); return }
    if (digits.length === 8) {
      setLoadingCep(true)
      try {
        const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
        const res = await fetch(`${basePath}/api/cep?cep=${digits}`)
        const data = await res.json()
        if (!data.error) {
          setLogradouro(data.logradouro || "")
          setBairroCep(data.bairro || "")
          setCidadeEndereco(data.cidade || "")
          setEstado(data.uf || "")
          if (data.complemento) setComplemento(data.complemento)
          setTimeout(() => document.getElementById("at-numero")?.focus(), 100)
        }
      } catch { /* silently fail */ }
      finally { setLoadingCep(false) }
    }
  }

  const validate = (): boolean => {
    const e: Record<string, boolean> = {}
    if (!validateCPF(cpf))        e.cpf = true
    if (nome.trim().length < 3)   e.nome = true
    if (!validatePhone(whatsapp)) e.whatsapp = true
    if (!validateEmail(email))    e.email = true
    if (!cidade)                  e.cidade = true
    if (!bairro)                  e.bairro = true
    if (!plano)                   e.plano = true
    if (!vencimento)              e.vencimento = true
    if (!aceitaTaxa)              e.taxa = true
    if (!validateCEP(cep))       e.cep = true
    if (!logradouro.trim())       e.logradouro = true
    if (!numero.trim())           e.numero = true
    if (!cidadeEndereco.trim())   e.cidadeEndereco = true
    if (!estado.trim())           e.estado = true
    setErrors(e)
    if (Object.keys(e).length > 0) {
      if (e.taxa) toast.error("Confirme o aceite da taxa de instalação")
      else toast.error("Preencha todos os campos obrigatórios")
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)

    const [planoVel, planoPre] = plano.split(" - ")

    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

      const s1 = await fetch(`${basePath}/api/step1`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: `atend-${Date.now()}`,
          nome: nome.trim(),
          email: email.trim(),
          whatsapp: whatsapp.replace(/\D/g, ""),
          origem: "atendimento",
        }),
      })
      const s1data = await s1.json()
      const leadId = s1data.lead_id

      await fetch(`${basePath}/api/step2`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: leadId,
          cpf: cpf.replace(/\D/g, ""),
          cidade, bairro, plano, vencimento,
          aceita_taxa_instalacao: true,
          origem: "atendimento",
        }),
      })

      const res = await fetch(`${basePath}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: String(leadId),
          nome: nome.trim(),
          cpfcnpj: cpf.replace(/\D/g, ""),
          email: email.trim(),
          celular: whatsapp.replace(/\D/g, ""),
          logradouro: `${logradouro.trim()}, ${numero.trim()}${complemento ? ` - ${complemento}` : ""}`,
          bairro: bairroCep || bairro,
          cidade: cidadeEndereco.trim(),
          uf: estado.trim(),
          cep: cep.replace(/\D/g, ""),
          cpf_duplicado: cpfDuplicado,
          origem: "atendimento",
          observacao: `Plano: ${planoVel} - ${planoPre} | Vencimento: Dia ${vencimento} | Cidade cobertura: ${cidade} | Bairro cobertura: ${bairro}`,
        }),
      })
      const result = await res.json()

      if (result.status === "success") {
        setDone(true)
      } else {
        toast.error("Erro ao enviar. Tente novamente.")
      }
    } catch {
      toast.error("Erro ao enviar. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setDone(false)
    setCpf(""); setNome(""); setWhatsapp(""); setEmail("")
    setCidade(""); setBairro(""); setPlano(""); setVencimento(""); setAceitaTaxa(false)
    setCep(""); setLogradouro(""); setNumero(""); setComplemento("")
    setBairroCep(""); setCidadeEndereco(""); setEstado("")
    setCpfDuplicado(false); setCpfStatus("idle"); setErrors({})
  }

  if (done) {
    return (
      <div className="w-full max-w-[560px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        <div className="flex flex-col items-center text-center p-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
            <CheckCircle2 className="w-11 h-11 text-green-500" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold mb-2" style={{ color: "var(--foreground)" }}>
            Lead registrado!
          </h2>
          <p className="text-[15px] mb-6" style={{ color: "var(--muted-foreground)" }}>
            Cadastro enviado ao SGP e e-mails disparados.
          </p>
          <button onClick={resetForm}
            className="px-8 py-3 rounded-xl font-heading text-[15px] font-bold text-white"
            style={{ background: "var(--primary)" }}>
            Novo cadastro
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[560px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border" style={{ background: "var(--secondary)" }}>
        <h2 className="font-heading text-[18px] font-extrabold text-white">Cadastro de Cliente</h2>
        <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
          Preencha os dados do cliente para registrar o lead
        </p>
      </div>

      <div className="p-6 flex flex-col gap-4">

        {/* Dados pessoais */}
        <SectionTitle>Dados pessoais</SectionTitle>

        <div>
          <Label required>CPF</Label>
          <input type="text" value={cpf}
            onChange={e => { const v = formatCPF(e.target.value); setCpf(v); setCpfStatus("idle"); setCpfDuplicado(false) }}
            onBlur={e => checkCpf(e.target.value)}
            placeholder="000.000.000-00" maxLength={14} className={inputClass(errors.cpf)} />
          {errors.cpf && <p className="text-xs mt-1 font-medium" style={{ color: "var(--destructive)" }}>CPF inválido</p>}
          {cpfStatus === "checking" && <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Verificando...</p>}
          {cpfStatus === "duplicate" && <p className="text-xs mt-1 font-medium" style={{ color: "#f97316" }}>CPF já cadastrado no SGP — lead encaminhado ao atendimento</p>}
          {cpfStatus === "ok" && <p className="text-xs mt-1 font-medium text-green-600">CPF disponível</p>}
        </div>

        <div>
          <Label required>Nome completo</Label>
          <input type="text" value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Nome do cliente" className={inputClass(errors.nome)} />
        </div>

        <div>
          <Label required>WhatsApp</Label>
          <input type="tel" value={whatsapp} onChange={e => setWhatsapp(formatPhone(e.target.value))}
            placeholder="(21) 99999-9999" maxLength={15} className={inputClass(errors.whatsapp)} />
          {errors.whatsapp && <p className="text-xs mt-1 font-medium" style={{ color: "var(--destructive)" }}>Informe DDD + número. Ex: (21) 99999-9999</p>}
        </div>

        <div>
          <Label required>E-mail</Label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="email@exemplo.com" className={inputClass(errors.email)} />
          {errors.email && <p className="text-xs mt-1 font-medium" style={{ color: "var(--destructive)" }}>E-mail inválido</p>}
        </div>

        {/* Localização */}
        <SectionTitle>Localização e Plano</SectionTitle>

        <div>
          <Label required>CEP</Label>
          <div className="relative max-w-[200px]">
            <input type="text" value={cep} onChange={e => handleCepChange(e.target.value)}
              placeholder="00000-000" maxLength={9} className={inputClass(errors.cep)} />
            {loadingCep && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Cidade</Label>
            <input type="text" value={cidadeEndereco} readOnly placeholder="Preenchido pelo CEP" className={inputClass(false, true)} />
          </div>
          <div>
            <Label>Bairro</Label>
            <input type="text" value={bairroCep} readOnly placeholder="Preenchido pelo CEP" className={inputClass(false, true)} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>Logradouro</Label>
            <input type="text" value={logradouro} onChange={e => setLogradouro(e.target.value)}
              placeholder="Rua, Avenida..." className={inputClass(errors.logradouro)} />
          </div>
          <div>
            <Label required>Número</Label>
            <input id="at-numero" type="text" value={numero} onChange={e => setNumero(e.target.value)}
              placeholder="Nº" className={inputClass(errors.numero)} />
          </div>
        </div>

        <div>
          <Label>Complemento</Label>
          <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)}
            placeholder="Apto, bloco, casa..." className={inputClass(false)} />
        </div>

        <div>
          <Label required>Cidade de cobertura</Label>
          <select value={cidade} onChange={e => setCidade(e.target.value)}
            className={cn(inputClass(errors.cidade), "cursor-pointer")}>
            <option value="">Selecione a cidade</option>
            {cidades.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <Label required>Bairro de cobertura</Label>
          <select value={bairro} onChange={e => setBairro(e.target.value)}
            disabled={!cidade} className={cn(inputClass(errors.bairro), "cursor-pointer disabled:opacity-50")}>
            <option value="">Selecione o bairro</option>
            {bairros.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div>
          <Label required>Plano</Label>
          <select value={plano} onChange={e => setPlano(e.target.value)}
            disabled={!bairro} className={cn(inputClass(errors.plano), "cursor-pointer disabled:opacity-50")}>
            <option value="">Selecione o plano</option>
            {planos.map(p => <option key={p.v} value={`${p.v} - ${p.p}`}>{p.v} — {p.p}</option>)}
          </select>
        </div>

        <div>
          <Label required>Vencimento</Label>
          <select value={vencimento} onChange={e => setVencimento(e.target.value)}
            disabled={!cidade} className={cn(inputClass(errors.vencimento), "cursor-pointer disabled:opacity-50")}>
            <option value="">Selecione</option>
            {vencimentos.map(v => <option key={v} value={v}>Dia {v}</option>)}
          </select>
        </div>

        {/* Taxa de instalação */}
        <div className={cn(
          "flex items-start gap-3 p-4 rounded-xl border-[1.5px] transition-all cursor-pointer",
          aceitaTaxa ? "border-primary bg-orange-50" : errors.taxa ? "border-destructive bg-red-50" : "border-border"
        )} onClick={() => setAceitaTaxa(v => !v)}>
          <div className="w-5 h-5 min-w-[20px] rounded border-[1.5px] flex items-center justify-center mt-0.5 transition-all"
            style={{ background: aceitaTaxa ? "var(--primary)" : "var(--input)", borderColor: aceitaTaxa ? "var(--primary)" : "var(--border)" }}>
            {aceitaTaxa && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <div>
            <p className="text-[14px] font-semibold" style={{ color: "var(--foreground)" }}>
              Taxa de instalação — R$ 150,00 via Pix
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              Cliente ciente e de acordo com a taxa de instalação
            </p>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="px-6 pb-6">
        <button onClick={handleSubmit} disabled={isSubmitting}
          className="w-full h-[54px] bg-primary text-white border-none rounded-xl font-heading text-[17px] font-bold cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_4px_16px_rgba(249,115,22,0.28)] transition-all hover:bg-[#ea6c0a] disabled:opacity-65 disabled:cursor-not-allowed">
          {isSubmitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
          ) : (
            <><Send className="w-5 h-5" /> Registrar Lead</>
          )}
        </button>
      </div>
    </div>
  )
}