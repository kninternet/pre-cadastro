export function formatCPF(value: string): string {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export function formatPhone(value: string): string {
  // Strip country code +55 or 55 prefix if present
  let digits = value.replace(/\D/g, '')
  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2)
  }

  // Limit to 11 digits (DDD + 9 digits)
  digits = digits.slice(0, 11)

  if (digits.length === 0) return ''

  // Format: (DD) 9XXXX-XXXX  → 11 digits (celular)
  //         (DD) XXXX-XXXX   → 10 digits (fixo)
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
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateCPF(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, '')

  if (digits.length !== 11) return false

  // Rejects all-same-digit CPFs (e.g. 111.111.111-11)
  if (/^(\d)\1{10}$/.test(digits)) return false

  // First check digit
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[9])) return false

  // Second check digit
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(digits[10])) return false

  return true
}

export function validatePhone(phone: string): boolean {
  let digits = phone.replace(/\D/g, '')
  // Strip country code if present
  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2)
  }
  // Valid: 10 digits (fixo: DDD + 8) or 11 digits (celular: DDD + 9)
  return digits.length === 10 || digits.length === 11
}

export function validateCEP(cep: string): boolean {
  const digits = cep.replace(/\D/g, '')
  return digits.length === 8
}
