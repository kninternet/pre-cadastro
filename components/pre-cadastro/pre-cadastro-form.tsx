"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ProgressBar } from "./progress-bar"
import { Step1 } from "./step-1"
import { Step2 } from "./step-2"
import { Step3 } from "./step-3"
import { ReviewStep } from "./review-step"

export interface IndicacaoData {
  indicador_nome: string
  indicador_primeiro_nome: string
  indicador_tipo: string
  indicador_valor: string
  indicador_cpf: string
  indicador_cliente_id: number | null
  indicador_validado: boolean
}
import { OtpVerification } from "./otp-verification"
import { WelcomeModal } from "./welcome-modal"
import { MgmWelcomeModal } from "./mgm-welcome-modal"
import { formatCPF, formatPhone, validateEmail, validateCPF, validatePhone, validateCEP, validateCpfCnpj } from "@/lib/formatters"
import { trackStep1View, trackStep1Next, trackStep2Next, trackStep3Submit, trackLeadSuccess, trackLeadError, getBrowserContext } from "@/lib/analytics"
import { DATA, getVencimentos } from "@/lib/data"
import { CIDADE_SLUG_TO_NOME, BAIRRO_SLUG_TO_NOME, PLANO_SLUG_TO_VELOCIDADE_PRECO, formatPlanoKey } from "@/lib/coverage-translation"

type FlowState = "form" | "review" | "mgm-validar" | "otp" | "done"

export function PreCadastroForm({ mgm = false, mgmVisitanteNome, mgmIndicadorNome }: {
  mgm?: boolean
  mgmVisitanteNome?: string
  mgmIndicadorNome?: string
}) {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)

  // ── MGM — Indicação ───────────────────────────────────────────────────────
  // Se a page já coletou os nomes via modal próprio, pula o modal interno.
  const mgmPreFilled = mgm && !!mgmVisitanteNome && !!mgmIndicadorNome
  const [mgmModalDone, setMgmModalDone] = useState(mgmPreFilled)
  const [indicacao, setIndicacao] = useState<IndicacaoData>({
    indicador_nome: mgmIndicadorNome ?? '',
    indicador_primeiro_nome: mgmIndicadorNome?.split(' ')[0] ?? '',
    indicador_tipo: '',
    indicador_valor: '',
    indicador_cpf: '',
    indicador_cliente_id: null,
    indicador_validado: false,
  })
  const [flowState, setFlowState] = useState<FlowState>("form")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})
  const [leadId, setLeadId] = useState<number | null>(null)
  const [sessionId] = useState(() => `sess-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`)
  const [editandoDeReview, setEditandoDeReview] = useState(false)

  // ── Step 1 — Dados pessoais ─────────────────────────────────────────────────
  const [nome, setNome] = useState(mgmVisitanteNome ?? "")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")

  // ── Step 2 — Cobertura, plano, CPF ─────────────────────────────────────────
  const [cidade, setCidade] = useState("")
  const [bairro, setBairro] = useState("")
  const [plano, setPlano] = useState("")
  const [vencimento, setVencimento] = useState("")
  const [aceitaTaxaInstalacao, setAceitaTaxaInstalacao] = useState(false)
  const [cpf, setCpf] = useState("")
  const [cpfDuplicado, setCpfDuplicado] = useState(false)
  const [tipoPessoa, setTipoPessoa] = useState<'F' | 'J'>('F')

  // ── Step 3 — Endereço ──────────────────────────────────────────────────────
  const [cep, setCep] = useState("")
  const [logradouro, setLogradouro] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairroCep, setBairroCep] = useState("")
  const [cidadeEndereco, setCidadeEndereco] = useState("")
  const [estado, setEstado] = useState("")

  useEffect(() => {
    trackStep1View()
    const nomeParam = searchParams.get("nome")
    const whatsappParam = searchParams.get("whatsapp") || searchParams.get("numero_whatsapp")
    const cpfParam = searchParams.get("cpf")
    const emailParam = searchParams.get("email")

    if (nomeParam) setNome(nomeParam)
    if (whatsappParam) setWhatsapp(formatPhone(whatsappParam))
    if (cpfParam) setCpf(formatCPF(cpfParam))
    if (emailParam) setEmail(emailParam)

    // ── Handoff site-next (contratar.tsx) → pre-cadastro ─────────────────────
    // A querystring chega com slugs próprios do site-next (ex: cidade=sao-goncalo,
    // bairro=santa-catarina, plano=sg-350). Traduz para os nomes literais e a
    // chave de plano usados internamente aqui, e só aplica se a combinação
    // realmente existir em DATA — nunca aceita um slug não reconhecido.
    const cidadeSlug = searchParams.get("cidade")
    const bairroSlug = searchParams.get("bairro")
    const planoSlug = searchParams.get("plano")
    const vencimentoParam = searchParams.get("vencimento")

    const cidadeNome = cidadeSlug ? CIDADE_SLUG_TO_NOME[cidadeSlug] : undefined
    const bairroNome = bairroSlug ? BAIRRO_SLUG_TO_NOME[bairroSlug] : undefined

    if (cidadeNome && bairroNome && DATA[cidadeNome]?.bairros[bairroNome]) {
      setCidade(cidadeNome)
      setBairro(bairroNome)

      const planoInfo = planoSlug ? PLANO_SLUG_TO_VELOCIDADE_PRECO[planoSlug] : undefined
      if (planoInfo) {
        const planoKey = formatPlanoKey(planoInfo.velocidade, planoInfo.preco)
        const planoExiste = DATA[cidadeNome].bairros[bairroNome].some(
          (p) => `${p.v} - ${p.p}` === planoKey
        )
        if (planoExiste) setPlano(planoKey)
      }

      if (vencimentoParam && getVencimentos(cidadeNome, bairroNome).includes(vencimentoParam)) {
        setVencimento(vencimentoParam)
      }
    } else if (cidadeSlug || bairroSlug || planoSlug) {
      console.warn("[HANDOFF SITE→CADASTRO] slug não reconhecido, seguindo sem pré-preencher:", {
        cidadeSlug, bairroSlug, planoSlug,
      })
    }
  }, [searchParams])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, boolean> = {}
    let isValid = true

    if (step === 1) {
      if (nome.trim().length < 3) { newErrors.nome = true; isValid = false }
      if (!validateEmail(email)) { newErrors.email = true; isValid = false }
      if (!validatePhone(whatsapp)) { newErrors.whatsapp = true; isValid = false }
    }

    if (step === 2) {
      if (!cidade) { newErrors.cidade = true; isValid = false }
      if (!bairro) { newErrors.bairro = true; isValid = false }
      if (!plano) { newErrors.plano = true; isValid = false }
      if (!vencimento) { newErrors.vencimento = true; isValid = false }
      if (!aceitaTaxaInstalacao) { newErrors.aceitaTaxaInstalacao = true; isValid = false }
      if (!validateCpfCnpj(cpf)) { newErrors.cpf = true; isValid = false }
    }

    if (step === 3) {
      if (!validateCEP(cep)) { newErrors.cep = true; isValid = false }
      if (!logradouro.trim()) { newErrors.logradouro = true; isValid = false }
      if (!numero.trim()) { newErrors.numero = true; isValid = false }
      if (!cidadeEndereco.trim()) { newErrors.cidadeEndereco = true; isValid = false }
      if (!estado.trim()) { newErrors.estado = true; isValid = false }
    }

    setErrors(newErrors)
    if (!isValid) {
      if (newErrors.aceitaTaxaInstalacao) {
        toast.error("Confirme o aceite da taxa de instalação para continuar")
      } else {
        toast.error("Preencha os campos obrigatórios")
      }
    }
    return isValid
  }

  const goToStep = async (step: number) => {
    if (step > currentStep) {
      if (!validateStep(currentStep)) return

      const ctx = getBrowserContext()

      if (currentStep === 1) {
        trackStep1Next({ cidade: "", bairro: "", plano: "", vencimento: "", sessionId })
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/step1`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              session_id: sessionId,
              nome: nome.trim(),
              email: email.trim(),
              whatsapp: whatsapp.replace(/\D/g, ""),
              origem: "web",
              utm_source: searchParams.get("utm_source") || undefined,
              utm_medium: searchParams.get("utm_medium") || undefined,
              utm_campaign: searchParams.get("utm_campaign") || undefined,
              utm_content: searchParams.get("utm_content") || undefined,
              utm_term: searchParams.get("utm_term") || undefined,
              ...ctx,
            }),
          })
          const data = await res.json()
          if (data.lead_id) setLeadId(data.lead_id)
        } catch {
          console.error("[STEP1 ERROR]")
        }
      }

      if (currentStep === 2) {
        trackStep2Next(leadId ?? 0)
        try {
          await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/step2`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              lead_id: leadId,
              cpf: cpf.replace(/\D/g, ""),
              cidade, bairro, plano, vencimento,
              aceita_taxa_instalacao: aceitaTaxaInstalacao,
              session_id: sessionId,
              ...ctx,
            }),
          })
        } catch {
          console.error("[STEP2 ERROR]")
        }
      }
    }

    setCurrentStep(step)
    setErrors({})
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const goToReview = () => {
    if (!validateStep(currentStep)) return
    setEditandoDeReview(false)
    setFlowState("review")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleStepNext = async (nextStep: number) => {
    if (editandoDeReview) {
      if (!validateStep(currentStep)) return
      setFlowState("review")
      setEditandoDeReview(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      await goToStep(nextStep)
    }
  }

  const handleEditStep = (step: number) => {
    setEditandoDeReview(true)
    setFlowState("form")
    setCurrentStep(step)
    setErrors({})
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const backFromStep2 = () => {
    if (editandoDeReview) {
      setFlowState("review")
      setEditandoDeReview(false)
    } else {
      goToStep(1)
    }
  }

  const backFromStep3 = () => {
    if (editandoDeReview) {
      setFlowState("review")
      setEditandoDeReview(false)
    } else {
      goToStep(2)
    }
  }

  const sendOtp = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
    } catch {
      console.error("Failed to send OTP email")
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    trackStep3Submit(leadId, sessionId)

    const ctx = getBrowserContext()
    const token = searchParams.get("token") || ""

    const payload = {
      nome: nome.trim(),
      logradouro: `${logradouro.trim()}, ${numero.trim()}${complemento ? ` - ${complemento}` : ""}`,
      bairro: bairroCep || bairro,
      cidade: cidadeEndereco.trim(),
      uf: estado.trim(),
      cep: cep.replace(/\D/g, ""),
      cpfcnpj: cpf.replace(/\D/g, ""),
      cpf_duplicado: cpfDuplicado,
      observacao: `Plano: ${plano} | Vencimento: Dia ${vencimento} | Cidade cobertura: ${cidade} | Bairro cobertura: ${bairro}`,
      email: email.trim(),
      celular: whatsapp.replace(/\D/g, ""),
      origem: mgm ? "amigodefibra" : "web",
      ...(token && { token }),
      ...(leadId && { lead_id: String(leadId) }),
      ...(mgm && indicacao.indicador_nome && {
        mgm: true,
        indicador_nome: indicacao.indicador_nome,
        indicador_primeiro_nome: indicacao.indicador_primeiro_nome,
        indicador_tipo: indicacao.indicador_tipo,
        indicador_valor: indicacao.indicador_valor,
        indicador_cpf: indicacao.indicador_cpf,
        indicador_cliente_id: indicacao.indicador_cliente_id,
        indicador_validado: indicacao.indicador_validado,
      }),
      ...ctx,
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/api/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (result.status === "success") {
        trackLeadSuccess({ cidade, bairro, plano, leadId, sessionId })
        await sendOtp()
        if (mgm && indicacao.indicador_nome) {
          setFlowState("mgm-validar")
        } else {
          setFlowState("otp")
        }
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else {
        throw new Error("status inesperado")
      }
    } catch {
      trackLeadError("submit_exception")
      toast.error("Erro ao enviar. Tente novamente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (flowState === "review") {
    return (
      <>
        {!mgm && <WelcomeModal />}
        <ProgressBar currentStep={4} />
        <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden shrink-0">
          <ReviewStep
            nome={nome}
            email={email}
            whatsapp={whatsapp.replace(/\D/g, "")}
            cidade={cidade}
            bairro={bairro}
            plano={plano}
            vencimento={vencimento}
            cpf={cpf.replace(/\D/g, "")}
            logradouro={logradouro}
            numero={numero}
            complemento={complemento}
            bairroCep={bairroCep}
            cidadeEndereco={cidadeEndereco}
            estado={estado}
            cep={cep.replace(/\D/g, "")}
            onConfirm={handleSubmit}
            onBack={() => { setFlowState("form"); window.scrollTo({ top: 0, behavior: "smooth" }) }}
            onEditStep={handleEditStep}
            isSubmitting={isSubmitting}
          />
        </div>
      </>
    )
  }

  if (flowState === "mgm-validar") {
    return (
      <>
        <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden shrink-0">
          <div className="flex flex-col items-center text-center p-8 md:p-12">
            <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mb-5">
              <span className="text-3xl">🤝</span>
            </div>
            <h2 className="font-heading text-xl font-extrabold text-foreground mb-2">
              Quase lá!
            </h2>
            <p className="text-[14px] text-muted-foreground max-w-[360px] leading-relaxed mb-4">
              Seu cadastro foi enviado com sucesso. Agora, ajude-nos a confirmar quem te indicou para garantir o mês grátis dele.
            </p>

            <MgmReferrerFollow
              indicadorNome={indicacao.indicador_nome}
              onValidated={(data) => {
                setIndicacao(prev => ({
                  ...prev,
                  indicador_nome: data.nome_completo || prev.indicador_nome,
                  indicador_primeiro_nome: data.primeiro_nome || prev.indicador_primeiro_nome,
                  indicador_cpf: data.cpf || prev.indicador_cpf,
                  indicador_cliente_id: data.cliente_id ?? prev.indicador_cliente_id,
                  indicador_validado: true,
                }))
              }}
            />

            <button
              onClick={() => { setFlowState("otp"); window.scrollTo({ top: 0, behavior: "smooth" }) }}
              className="mt-5 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              Confirmar e-mail →
            </button>
          </div>
        </div>
      </>
    )
  }

  if (flowState === "otp") {
    return (
      <>
        {!mgm && <WelcomeModal />}
        <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden shrink-0">
          <OtpVerification
            email={email}
            vencimento={vencimento}
            onVerified={() => setFlowState("done")}
            onResend={sendOtp}
          />
        </div>
      </>
    )
  }

  if (flowState === "done") {
    return (
      <>
        {!mgm && <WelcomeModal />}
        <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden shrink-0">
          <div className="flex flex-col items-center text-center p-8 md:p-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <svg className="w-11 h-11 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2.5">
              Cadastro Confirmado!
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-[360px] leading-relaxed">
              Obrigado por escolher a KN Internet! Em breve nossa equipe entrará em contato pelo WhatsApp informado.
            </p>
            <div className="mt-5 bg-muted border border-border rounded-xl px-5 py-3.5 text-sm text-foreground w-full max-w-[340px]">
              📅 Vencimento: todo dia <strong className="text-primary">{vencimento}</strong> de cada mês
            </div>

            {mgm && indicacao.indicador_nome && (
              <div className="mt-5 bg-green-50 border border-green-200 rounded-xl px-5 py-3.5 text-sm text-left w-full max-w-[340px]">
                <p className="font-semibold text-green-700">
                  🤝 Indicado por {indicacao.indicador_nome}
                  {indicacao.indicador_validado && " ✓"}
                </p>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="mt-7 px-8 py-3 bg-transparent border-[1.5px] border-secondary rounded-xl font-heading text-[15px] font-bold text-secondary cursor-pointer transition-all hover:bg-secondary hover:text-white"
            >
              Fazer novo cadastro
            </button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      {mgm && !mgmModalDone ? (
        <MgmWelcomeModal
          onSubmit={({ visitanteName, indicadorNome }) => {
            setNome(visitanteName)
            setIndicacao(prev => ({
              ...prev,
              indicador_nome: indicadorNome,
              indicador_primeiro_nome: indicadorNome.split(' ')[0],
            }))
            setMgmModalDone(true)
          }}
        />
      ) : !mgm ? (
        <WelcomeModal />
      ) : null}
      <ProgressBar currentStep={currentStep} />

      <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden shrink-0">
        {currentStep === 1 && (
          <Step1
            nome={nome} setNome={setNome}
            email={email} setEmail={setEmail}
            whatsapp={whatsapp} setWhatsapp={setWhatsapp}
            errors={errors}
            onNext={() => handleStepNext(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2
            cidade={cidade} setCidade={setCidade}
            bairro={bairro} setBairro={setBairro}
            plano={plano} setPlano={setPlano}
            vencimento={vencimento} setVencimento={setVencimento}
            aceitaTaxaInstalacao={aceitaTaxaInstalacao} setAceitaTaxaInstalacao={setAceitaTaxaInstalacao}
            cpf={cpf} setCpf={setCpf}
            cpfDuplicado={cpfDuplicado} setCpfDuplicado={setCpfDuplicado}
            tipoPessoa={tipoPessoa} setTipoPessoa={setTipoPessoa}
            errors={errors}
            onNext={() => handleStepNext(3)}
            onBack={backFromStep2}
          />
        )}

        {currentStep === 3 && (
          <Step3
            cidade={cidade}
            tipoPessoa={tipoPessoa}
            cep={cep} setCep={setCep}
            logradouro={logradouro} setLogradouro={setLogradouro}
            numero={numero} setNumero={setNumero}
            complemento={complemento} setComplemento={setComplemento}
            bairroCep={bairroCep} setBairroCep={setBairroCep}
            cidadeEndereco={cidadeEndereco} setCidadeEndereco={setCidadeEndereco}
            estado={estado} setEstado={setEstado}
            errors={errors}
            onSubmit={async () => goToReview()}
            onBack={backFromStep3}
            onGoToStep1={() => goToStep(1)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </>
  )
}
// ── MGM: Post-submit referrer validation ─────────────────────────────────
function MgmReferrerFollow({ indicadorNome, onValidated }: {
  indicadorNome: string
  onValidated?: (data: { primeiro_nome: string; nome_completo: string; cliente_id: number | null; cpf: string }) => void
}) {
  const [nomeEditavel, setNomeEditavel] = useState(indicadorNome)
  const [editando, setEditando] = useState(false)
  const [tipo, setTipo] = useState('')
  const [valor, setValor] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function handleValidar() {
    if (!tipo || !valor.trim()) return
    setLoading(true)
    setStatus('idle')
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
        setStatus('ok')
        setMsg(`Indicador confirmado: ${data.primeiro_nome}! O mês grátis será aplicado após a ativação.`)
        onValidated?.({
          primeiro_nome: data.primeiro_nome,
          nome_completo: data.nome_completo,
          cliente_id: data.cliente_id,
          cpf: data.cpf,
        })
      } else {
        setStatus('error')
        setMsg(data.message || 'Não encontramos esse cadastro.')
      }
    } catch {
      setStatus('error')
      setMsg('Erro ao consultar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'ok') {
    return (
      <div className="mt-6 w-full max-w-[380px] bg-green-50 border border-green-200 rounded-xl p-4 text-left">
        <p className="text-sm font-semibold text-green-700 flex items-center gap-2">
          🤝 {msg}
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 w-full max-w-[380px] bg-muted border border-border rounded-xl p-4 text-left">
      <div className="flex items-center justify-between mb-1">
        {editando ? (
          <div className="flex-1 flex items-center gap-2">
            <span className="text-sm">🤝</span>
            <input
              type="text"
              value={nomeEditavel}
              onChange={(e) => setNomeEditavel(e.target.value)}
              className="flex-1 h-[34px] px-2.5 bg-input border border-border rounded-lg text-sm outline-none focus:border-primary"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') setEditando(false) }}
            />
            <button
              onClick={() => setEditando(false)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              OK
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-semibold text-foreground">
              🤝 Indicado por {nomeEditavel}
            </p>
            <button
              onClick={() => setEditando(true)}
              className="text-xs font-medium text-primary hover:underline ml-2"
            >
              Editar
            </button>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Para garantir o mês grátis do seu amigo, informe o CPF, e-mail ou WhatsApp dele:
      </p>
      <div className="flex flex-col gap-2">
        <select
          value={tipo}
          onChange={(e) => { setTipo(e.target.value); setValor(''); setStatus('idle'); setMsg('') }}
          className="w-full h-[40px] px-3 bg-input border border-border rounded-lg text-sm outline-none appearance-none cursor-pointer"
          style={{ color: tipo ? 'var(--foreground)' : 'var(--muted-foreground)' }}
        >
          <option value="" disabled>Selecione</option>
          <option value="cpf">CPF</option>
          <option value="email">E-mail</option>
          <option value="telefone">WhatsApp</option>
        </select>
        {tipo && (
          <input
            type={tipo === 'email' ? 'email' : 'text'}
            value={valor}
            onChange={(e) => {
              let v = e.target.value
              if (tipo === 'cpf') v = formatCPF(v)
              if (tipo === 'telefone') v = formatPhone(v)
              setValor(v)
              setStatus('idle')
              setMsg('')
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleValidar() }}
            placeholder={tipo === 'cpf' ? '000.000.000-00' : tipo === 'email' ? 'email@exemplo.com' : '(21) 99999-9999'}
            maxLength={tipo === 'cpf' ? 14 : tipo === 'telefone' ? 15 : undefined}
            inputMode={tipo === 'cpf' || tipo === 'telefone' ? 'numeric' : undefined}
            className="w-full h-[40px] px-3 bg-input border border-border rounded-lg text-sm outline-none"
          />
        )}
        {status === 'error' && (
          <p className="text-xs text-destructive">{msg}</p>
        )}
        <button
          onClick={handleValidar}
          disabled={!tipo || !valor.trim() || loading}
          className="w-full h-[40px] bg-primary text-white rounded-lg text-sm font-bold cursor-pointer transition-all hover:bg-[#ea6c0a] disabled:opacity-50"
        >
          {loading ? 'Verificando...' : 'Confirmar indicador'}
        </button>
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        Não tem esses dados agora? Sem problema — nossa equipe perguntará durante o contato.
      </p>
    </div>
  )
}
