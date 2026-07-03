import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export function validarCPF(c: string): boolean {
  if (/^(\d)\1{10}$/.test(c)) return false
  const calc = (x: number) => {
    let sum = 0
    for (let i = 0; i < x; i++) sum += parseInt(c[i]) * (x + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 || r === 11 ? 0 : r
  }
  return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10])
}

export type CheckCpfResult =
  | { ok: true; found: false }
  | { ok: true; found: true; nome: string; temContratoAtivo: boolean }
  | { ok: false; status: 400; message: string }
  | { ok: false; status: 502; message: string }

/**
 * Consulta CPF diretamente no SGP CRM.
 * Usado tanto por /api/check-cpf (externo, Bearer) quanto por /api/internal/check-cpf (front-end, sem Bearer).
 */
export async function checkCpfInSgp(cpfRaw: string): Promise<CheckCpfResult> {
  const cpf = cpfRaw?.replace(/\D/g, '') ?? ''

  if (cpf.length !== 11) {
    return { ok: false, status: 400, message: 'CPF inválido' }
  }
  if (!validarCPF(cpf)) {
    return { ok: false, status: 400, message: 'CPF inválido' }
  }

  const app = process.env.SGP_APP ?? ''
  const token = process.env.SGP_TOKEN ?? ''
  const base = process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'

  try {
    const { stdout } = await execAsync(
      `curl -s -X GET '${base}/api/crm/cliente/contratos/?cpfcnpj=${cpf}' --form 'app="${app}"' --form 'token="${token}"'`,
      { timeout: 6000 }
    )

    const data = JSON.parse(stdout) as Record<string, unknown>
    console.log('[SGP CHECK-CPF RESPONSE]', JSON.stringify(data))

    if (data.errors) {
      return { ok: true, found: false }
    }

    const contratos = (data.contratos as Array<{ status: string }>) ?? []
    const temContratoAtivo = contratos.some(c => c.status?.trim().toLowerCase() === 'ativo')

    return { ok: true, found: true, nome: (data.cliente as string) ?? '', temContratoAtivo }
  } catch (err) {
    console.error('[SGP CHECK-CPF ERROR]', err)
    // Timeout ou erro de rede com o SGP: não bloqueia o fluxo, mas sinaliza pra quem chamou.
    return { ok: false, status: 502, message: 'timeout' }
  }
}

export type BuscarCepResult =
  | { ok: true; logradouro: string; bairro: string; cidade: string; uf: string; complemento: string }
  | { ok: false; status: 400 | 404 | 500; message: string }

/**
 * Busca endereço por CEP via ViaCEP.
 * Usado tanto por /api/cep (externo, Bearer) quanto por /api/internal/cep (front-end, sem Bearer).
 */
export async function buscarCep(cepRaw: string): Promise<BuscarCepResult> {
  const cep = cepRaw?.replace(/\D/g, '') ?? ''

  if (cep.length !== 8) {
    return { ok: false, status: 400, message: 'CEP inválido' }
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()

    if (data.erro) {
      return { ok: false, status: 404, message: 'CEP não encontrado' }
    }

    return {
      ok: true,
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
      complemento: data.complemento || '',
    }
  } catch {
    return { ok: false, status: 500, message: 'Erro ao buscar CEP' }
  }
}
