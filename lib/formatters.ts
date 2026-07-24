export function formatCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export function formatCNPJ(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

/** Detecta o tipo a partir dos dígitos brutos */
export function detectTipoPessoa(value: string): 'F' | 'J' | null {
  const digits = value.replace(/\D/g, '')
  if (digits.length <= 11) return 'F'
  if (digits.length <= 14) return 'J'
  return null
}

/** Formata CPF ou CNPJ automaticamente conforme o número de dígitos */
export function formatCpfCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 11) return formatCPF(digits)
  return formatCNPJ(digits)
}

export function formatPhone(value: string): string {
  let digits = value.replace(/\D/g, '')
  // Strip DDI 55 se presente
  if (digits.startsWith('55') && digits.length >= 11) {
    digits = digits.slice(2)
  }
  digits = digits.slice(0, 11)
  if (digits.length === 0) return ''
  if (digits.length <= 2) return `(${digits}`
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function formatCEP(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1')
}

export function validateEmail(email: string): boolean {
  // Bloqueia caracteres especiais fora do padrão ASCII (ex: acentos)
  if (/[^\x00-\x7F]/.test(email)) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')
  if (digits.length !== 11) return false
  if (/^(\d)\1{10}$/.test(digits)) return false
  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i)
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[9])) return false
  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[10])) return false
  return true
}

export function validateCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return false
  if (/^(\d)\1{13}$/.test(digits)) return false
  const calc = (d: string, len: number) => {
    let sum = 0
    let pos = len - 7
    for (let i = len; i >= 1; i--) {
      sum += parseInt(d[len - i]) * pos--
      if (pos < 2) pos = 9
    }
    const r = sum % 11
    return r < 2 ? 0 : 11 - r
  }
  if (calc(digits, 12) !== parseInt(digits[12])) return false
  if (calc(digits, 13) !== parseInt(digits[13])) return false
  return true
}

export function validateCpfCnpj(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length === 11) return validateCPF(value)
  if (digits.length === 14) return validateCNPJ(value)
  return false
}

export function validatePhone(phone: string): boolean {
  let digits = phone.replace(/\D/g, '')
  // Strip DDI 55 se presente
  if (digits.startsWith('55') && digits.length >= 11) digits = digits.slice(2)
  // Fixo: DDD + 8 dígitos (10 total)
  if (digits.length === 10) return true
  // Celular: DDD + 9 + 8 dígitos (11 total, terceiro dígito obrigatoriamente 9)
  if (digits.length === 11 && digits[2] === '9') return true
  return false
}

// Sanitiza celular para envio ao SGP
// Remove DDI 55, garante formato correto
export function sanitizePhoneForSGP(phone: string): string {
  let digits = phone.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length >= 11) digits = digits.slice(2)
  return digits
}

export function validateCEP(cep: string): boolean {
  return cep.replace(/\D/g, '').length === 8
}