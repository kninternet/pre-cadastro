"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { ProgressBar } from "./progress-bar"
import { Step1 } from "./step-1"
import { Step2 } from "./step-2"
import { Step3 } from "./step-3"
import { OtpVerification } from "./otp-verification"
import { WelcomeModal } from "./welcome-modal"
import { formatCPF, formatPhone, validateEmail, validateCPF, validatePhone, validateCEP } from "@/lib/formatters"
import { trackStep1View, trackStep1Next, trackStep2Next, trackStep3Submit, trackLeadSuccess, trackLeadError } from "@/lib/analytics"

type FlowState = "form" | "otp" | "done"

export function PreCadastroForm() {
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(1)
  const [flowState, setFlowState] = useState<FlowState>("form")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  // Step 1
  const [cidade, setCidade] = useState("")
  const [bairro, setBairro] = useState("")
  const [plano, setPlano] = useState("")
  const [vencimento, setVencimento] = useState("")
  const [aceitaTaxaInstalacao, setAceitaTaxaInstalacao] = useState(false)

  // Step 2
  const [nome, setNome] = useState("")
  const [cpf, setCpf] = useState("")
  const [email, setEmail] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [telefoneFixo, setTelefoneFixo] = useState("")
  const [telefoneResidencial, setTelefoneResidencial] = useState("")

  // Step 3
  const [cep, setCep] = useState("")
  const [logradouro, setLogradouro] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairroCep, setBairroCep] = useState("")
  const [cidadeEndereco, setCidadeEndereco] = useState("")
  const [estado, setEstado] = useState("")
  const [pontoReferencia, setPontoReferencia] = useState("")

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
  }, [searchParams])

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, boolean> = {}
    let isValid = true

    if (step === 1) {
      if (!cidade) { newErrors.cidade = true; isValid = false }
      if (!bairro) { newErrors.bairro = true; isValid = false }
      if (!plano) { newErrors.plano = true; isValid = false }
      if (!vencimento) { newErrors.vencimento = true; isValid = false }
      if (!aceitaTaxaInstalacao) { newErrors.aceitaTaxaInstalacao = true; isValid = false }
    }

    if (step === 2) {
      if (nome.trim().length < 3) { newErrors.nome = true; isValid = false }
      if (!validateCPF(cpf)) { newErrors.cpf = true; isValid = false }
      if (!validateEmail(email)) { newErrors.email = true; isValid = false }
      if (!validatePhone(whatsapp)) { newErrors.whatsapp = true; isValid = false }
    }

    if (step === 3) {
      if (!validateCEP(cep)) { newErrors.cep = true; isValid = false }
      if (!logradouro.trim()) { newErrors.logradouro = true; isValid = false }
      if (!numero.trim()) { newErrors.numero = true; isValid = false }
      if (!cidadeEndereco.trim()) { newErrors.cidadeEndereco = true; isValid = false }
      if (!estado.trim()) { newErrors.estado = true; isValid = false }
      if (pontoReferencia.trim().length < 3) { newErrors.pontoReferencia = true; isValid = false }
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

  const goToStep = (step: number) => {
    if (step > currentStep) {
      if (!validateStep(currentStep)) return

      if (currentStep === 1) {
        trackStep1Next({ cidade, bairro, plano, vencimento })
      }
      if (currentStep === 2) {
        trackStep2Next()
      }
    }
    setCurrentStep(step)
    setErrors({})
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const sendOtp = async () => {
    try {
      await fetch("/api/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
    } catch {
      console.error("Failed to send OTP email")
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    setIsSubmitting(true)
    trackStep3Submit()

    const token = searchParams.get("token") || ""
    const payload = {
      nome: nome.trim(),
      logradouro: `${logradouro.trim()}, ${numero.trim()}${complemento ? ` - ${complemento}` : ""}`,
      bairro,
      cidade: cidadeEndereco.trim(),
      uf: estado.trim(),
      cep: cep.replace(/\D/g, ""),
      pontoreferencia: pontoReferencia.trim(),
      datanasc: "",
      cpfcnpj: cpf.replace(/\D/g, ""),
      observacao: `Plano: ${plano} | Vencimento: Dia ${vencimento} | Cidade cobertura: ${cidade}`,
      email: email.trim(),
      celular: whatsapp.replace(/\D/g, ""),
      ...(token && { token }),
    }

    try {
      const response = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await response.json()

      if (result.status === "success") {
        trackLeadSuccess({ cidade, bairro, plano })
        await sendOtp()
        setFlowState("otp")
        window.scrollTo({ top: 0, behavior: "smooth" })
      } else if (result.status === "erro cpf ja cadastrado") {
        toast.error("CPF já cadastrado no sistema")
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

  if (flowState === "otp") {
    return (
      <>
        <WelcomeModal />
        <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
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
        <WelcomeModal />
        <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
          <div className="flex flex-col items-center text-center p-8 md:p-12">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <svg className="w-11 h-11 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl font-extrabold text-foreground mb-2.5">
              Pré-Cadastro Confirmado!
            </h2>
            <p className="text-[15px] text-muted-foreground max-w-[360px] leading-relaxed">
              Obrigado por escolher a KN Internet! Em breve nossa equipe entrará em contato pelo WhatsApp informado.
            </p>
            <div className="mt-5 bg-muted border border-border rounded-xl px-5 py-3.5 text-sm text-foreground w-full max-w-[340px]">
              📅 Vencimento: todo dia <strong className="text-primary">{vencimento}</strong> de cada mês
            </div>
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
      <WelcomeModal />
      <ProgressBar currentStep={currentStep} />

      <div className="w-full max-w-[680px] bg-card rounded-2xl shadow-xl border border-border overflow-hidden">
        {currentStep === 1 && (
          <Step1
            cidade={cidade}
            setCidade={setCidade}
            bairro={bairro}
            setBairro={setBairro}
            plano={plano}
            setPlano={setPlano}
            vencimento={vencimento}
            setVencimento={setVencimento}
            aceitaTaxaInstalacao={aceitaTaxaInstalacao}
            setAceitaTaxaInstalacao={setAceitaTaxaInstalacao}
            errors={errors}
            onNext={() => goToStep(2)}
          />
        )}

        {currentStep === 2 && (
          <Step2
            nome={nome}
            setNome={setNome}
            cpf={cpf}
            setCpf={setCpf}
            email={email}
            setEmail={setEmail}
            whatsapp={whatsapp}
            setWhatsapp={setWhatsapp}
            telefoneFixo={telefoneFixo}
            setTelefoneFixo={setTelefoneFixo}
            telefoneResidencial={telefoneResidencial}
            setTelefoneResidencial={setTelefoneResidencial}
            errors={errors}
            onNext={() => goToStep(3)}
            onBack={() => goToStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3
            cidade={cidade}
            cep={cep}
            setCep={setCep}
            logradouro={logradouro}
            setLogradouro={setLogradouro}
            numero={numero}
            setNumero={setNumero}
            complemento={complemento}
            setComplemento={setComplemento}
            bairroCep={bairroCep}
            setBairroCep={setBairroCep}
            cidadeEndereco={cidadeEndereco}
            setCidadeEndereco={setCidadeEndereco}
            estado={estado}
            setEstado={setEstado}
            pontoReferencia={pontoReferencia}
            setPontoReferencia={setPontoReferencia}
            errors={errors}
            onSubmit={handleSubmit}
            onBack={() => goToStep(2)}
            onGoToStep1={() => goToStep(1)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </>
  )
}
