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

  try {
    const sgpRes = await fetchWithTimeout(
      `${process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'}/api/crm/cliente/contratos/?cpfcnpj=${cpf}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          app: process.env.SGP_APP ?? '',
          token: process.env.SGP_TOKEN ?? '',
        }),
      },
      6000
    )

    const data = await sgpRes.json() as Record<string, unknown>

    // CPF não encontrado no SGP
    if (data.errors) {
      return NextResponse.json({ found: false })
    }

    // CPF encontrado — retorna nome e status dos contratos
    const contratos = data.contratos as Array<{ status: string; cliente_contrato_id: number }> ?? []
    const temContratoAtivo = contratos.some(c => c.status?.trim().toLowerCase() === 'ativo')

    return NextResponse.json({
      found: true,
      nome: data.cliente ?? '',
      temContratoAtivo,
    })
  } catch (err) {
    console.error('[CHECK-CPF ERROR]', err)
    // Em caso de timeout ou erro de rede, deixa o fluxo continuar
    return NextResponse.json({ found: false, error: 'timeout' })
  }
}
