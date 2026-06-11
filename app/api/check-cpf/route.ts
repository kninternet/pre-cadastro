import { NextResponse } from 'next/server'

function fetchWithTimeout(url: string, options: RequestInit, ms = 6000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(timeout))
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cpf = searchParams.get('cpf')?.replace(/\D/g, '')

  if (!cpf || cpf.length !== 11) {
    return NextResponse.json({ status: 'error', message: 'CPF inválido' }, { status: 400 })
  }

  const app   = process.env.SGP_APP ?? ''
  const token = process.env.SGP_TOKEN ?? ''
  const base  = process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'

  // SGP GET não aceita body — app e token vão como form params via POST
  // A documentação usa GET com body (form), mas fetch não permite body em GET
  // Solução: usar POST na rota de consulta por CPF
  try {
    const sgpRes = await fetchWithTimeout(
      `${base}/api/crm/cliente/contratos/?cpfcnpj=${cpf}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ app, token }).toString(),
      },
      6000
    )

    const data = await sgpRes.json() as Record<string, unknown>
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
