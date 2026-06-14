"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Mail, CheckCircle2, RefreshCw, ArrowRight, Shield } from "lucide-react"

interface OtpVerificationProps {
  email: string
  vencimento: string
  onVerified: () => void
  onResend: () => Promise<void>
}

export function OtpVerification({ email, vencimento, onVerified, onResend }: OtpVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [error, setError] = useState("")
  const [verifying, setVerifying] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(60)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(false)
  const [showSkipModal, setShowSkipModal] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [resendCooldown])

  // Modal de "não tenho acesso ao email" após 35 segundos
  useEffect(() => {
    const timer = setTimeout(() => setShowSkipModal(true), 35000)
    return () => clearTimeout(timer)
  }, [])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    setError("")
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (!pasted) return
    const newOtp = [...otp]
    pasted.split("").forEach((char, i) => { if (i < 6) newOtp[i] = char })
    setOtp(newOtp)
    inputRefs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleVerify = useCallback(async () => {
    const code = otp.join("")
    if (code.length < 6) {
      setError("Digite o código completo de 6 dígitos")
      return
    }
    setVerifying(true)
    setError("")
    try {
      const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
      const res = await fetch(`${basePath}/api/otp`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Código inválido")
      setVerified(true)
      setTimeout(() => onVerified(), 1800)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Código inválido. Tente novamente.")
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setVerifying(false)
    }
  }, [otp, email, onVerified])

  useEffect(() => {
    if (otp.every((d) => d !== "") && !verifying && !verified) {
      handleVerify()
    }
  }, [otp, verifying, verified, handleVerify])

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return
    setResending(true)
    try {
      await onResend()
      setResendCooldown(60)
      setOtp(["", "", "", "", "", ""])
      setError("")
      setShowSkipModal(false)
      inputRefs.current[0]?.focus()
    } finally {
      setResending(false)
    }
  }

  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(b.length) + c)

  if (verified) {
    return (
      <div className="flex flex-col items-center text-center p-8 md:p-12">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: "rgba(34,197,94,0.12)" }}>
          <CheckCircle2 className="w-11 h-11" style={{ color: "#22c55e" }} />
        </div>
        <h2 className="font-heading text-2xl font-extrabold mb-2" style={{ color: "var(--foreground)" }}>
          Email Verificado! ✅
        </h2>
        <p className="text-[15px]" style={{ color: "var(--muted-foreground)" }}>
          Seu pré-cadastro está confirmado. Nossa equipe entrará em contato em breve.
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Modal "Não tenho acesso ao e-mail" */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-[380px] rounded-2xl p-6 shadow-2xl" style={{ background: "var(--card)", border: "1.5px solid var(--border)" }}>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "rgba(249,115,22,0.1)" }}>
                <Mail className="w-7 h-7" style={{ color: "var(--primary)" }} />
              </div>
              <div>
                <h3 className="font-heading text-[17px] font-extrabold mb-1.5" style={{ color: "var(--foreground)" }}>
                  Não recebeu o código?
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  Se não tem acesso ao e-mail agora, pode pular esta etapa. Seu cadastro já foi registrado com sucesso.
                </p>
              </div>
              <div className="w-full flex flex-col gap-2.5">
                <button
                  onClick={() => { setShowSkipModal(false); onVerified() }}
                  className="w-full h-[48px] rounded-xl font-heading text-[15px] font-bold text-white flex items-center justify-center transition-all"
                  style={{ background: "var(--primary)", boxShadow: "0 4px 16px rgba(249,115,22,0.28)" }}
                >
                  Não tenho acesso ao e-mail
                </button>
                <button
                  onClick={() => { setShowSkipModal(false); handleResend() }}
                  className="w-full h-[48px] rounded-xl font-heading text-[15px] font-bold transition-all"
                  style={{ background: "transparent", border: "1.5px solid var(--border)", color: "var(--foreground)" }}
                >
                  Reenviar código
                </button>
                <button
                  onClick={() => setShowSkipModal(false)}
                  className="text-[13px] font-medium underline cursor-pointer"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col items-center text-center p-7 md:p-10">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: "rgba(249,115,22,0.1)", border: "1.5px solid rgba(249,115,22,0.2)" }}>
          <Mail className="w-8 h-8" style={{ color: "var(--primary)" }} />
        </div>

        <h2 className="font-heading text-[22px] font-extrabold mb-2" style={{ color: "var(--foreground)" }}>
          Confirme seu e-mail
        </h2>
        <p className="text-[14px] leading-relaxed mb-1 max-w-[320px]" style={{ color: "var(--muted-foreground)" }}>
          Enviamos um código de 6 dígitos para
        </p>
        <p className="text-[15px] font-bold mb-6" style={{ color: "var(--foreground)" }}>
          {maskedEmail}
        </p>

        <div className="mb-6 px-4 py-3 rounded-xl text-sm w-full max-w-[320px]" style={{ background: "var(--muted)", border: "1.5px solid var(--border)" }}>
          📅 Vencimento confirmado: todo dia{" "}
          <strong style={{ color: "var(--primary)" }}>{vencimento}</strong> de cada mês
        </div>

        <div className="flex gap-2.5 mb-2" onPaste={handlePaste}>
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={verifying || verified}
              className="w-11 h-14 text-center font-heading text-[22px] font-bold rounded-xl transition-all outline-none disabled:opacity-50"
              style={{
                background: "var(--input)",
                border: `2px solid ${error ? "var(--destructive)" : digit ? "var(--primary)" : "var(--border)"}`,
                color: "var(--foreground)",
                boxShadow: digit && !error ? "0 0 0 3px rgba(249,115,22,0.12)" : "none",
              }}
            />
          ))}
        </div>

        {error && (
          <p className="text-xs font-medium mb-3" style={{ color: "var(--destructive)" }}>
            {error}
          </p>
        )}

        {!otp.every((d) => d !== "") && (
          <button
            onClick={handleVerify}
            disabled={verifying || otp.join("").length < 6}
            className="mt-4 w-full max-w-[320px] h-[50px] rounded-xl font-heading text-[16px] font-bold text-white border-none cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ background: "var(--primary)", boxShadow: "0 4px 16px rgba(249,115,22,0.28)" }}
          >
            {verifying ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>Verificar código <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        )}

        {verifying && otp.every((d) => d !== "") && (
          <div className="mt-4 flex items-center gap-2" style={{ color: "var(--muted-foreground)" }}>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Verificando...</span>
          </div>
        )}

        <div className="mt-5 flex flex-col items-center gap-1">
          <span className="text-[13px]" style={{ color: "var(--muted-foreground)" }}>
            Não recebeu o código?
          </span>
          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="text-[13px] font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: "var(--primary)" }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
            {resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : resending ? "Reenviando..." : "Reenviar código"}
          </button>
        </div>

        {/* Bypass manual */}
        <button
          onClick={() => setShowSkipModal(true)}
          className="mt-4 text-[12px] underline cursor-pointer transition-all"
          style={{ color: "var(--muted-foreground)" }}
        >
          Não tenho acesso ao meu e-mail
        </button>

        <div className="mt-3 text-[12px] flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
          <Shield className="w-3.5 h-3.5" />
          O código expira em 10 minutos
        </div>
      </div>
    </>
  )
}