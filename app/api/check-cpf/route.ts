import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cpf = searchParams.get('cpf')?.replace(/\D/g, '')

  if (!cpf || cpf.length !== 11) {
    return NextResponse.json({ status: 'error', message: 'CPF inválido' }, { status: 400 })
  }

  const app   = process.env.SGP_APP ?? ''
  const token = process.env.SGP_TOKEN ?? ''
  const base  = process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'

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