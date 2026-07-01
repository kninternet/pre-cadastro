import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const authHeader = request.headers.get('authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET ?? ''
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ status: 'error', message: 'Não autorizado' }, { status: 401 })
  }

  const cpf = searchParams.get('cpf')?.replace(/\D/g, '')

  if (!cpf || cpf.length !== 11) {
    return NextResponse.json({ status: 'error', valid: false, message: 'CPF inválido' }, { status: 400 })
  }

  function validarCPF(c: string): boolean {
    if (/^(\d)\1{10}$/.test(c)) return false
    const calc = (x: number) => {
      let sum = 0
      for (let i = 0; i < x; i++) sum += parseInt(c[i]) * (x + 1 - i)
      const r = (sum * 10) % 11
      return r === 10 || r === 11 ? 0 : r
    }
    return calc(9) === parseInt(c[9]) && calc(10) === parseInt(c[10])
  }

  if (!validarCPF(cpf)) {
    return NextResponse.json({ status: 'error', valid: false, message: 'CPF inválido' }, { status: 400 })
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
    console.log('[CHECK-CPF RESPONSE]', JSON.stringify(data))

    if (data.errors) {
      return NextResponse.json({ found: false })
    }

    const contratos = data.contratos as Array<{ status: string }> ?? []
    const temContratoAtivo = contratos.some(c => c.status?.trim().toLowerCase() === 'ativo')

    return NextResponse.json({
      found: true,
      nome: data.cliente ?? '',
      temContratoAtivo,
    })
  } catch (err) {
    console.error('[CHECK-CPF ERROR]', err)
    return NextResponse.json({ found: false, error: 'timeout' })
  }
}