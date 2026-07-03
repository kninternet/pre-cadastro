import { NextResponse } from 'next/server'
import { checkCpfInSgp } from '@/lib/sgp-client'

/**
 * Rota INTERNA — consumida apenas pelo próprio front-end (step-2, step-3, atendimento).
 * Sem Bearer: quem preenche o formulário é um visitante anônimo do site, não um
 * consumidor externo autenticado (esse é o /api/check-cpf, usado pela JetChat).
 * Mesma lógica de consulta ao SGP, contrato de resposta idêntico ao /api/check-cpf.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cpf = searchParams.get('cpf') ?? ''
  const result = await checkCpfInSgp(cpf)

  if (!result.ok) {
    if (result.status === 502) {
      return NextResponse.json({ found: false, error: 'timeout' })
    }
    return NextResponse.json({ status: 'error', valid: false, message: result.message }, { status: result.status })
  }

  if (!result.found) {
    return NextResponse.json({ found: false })
  }

  return NextResponse.json({ found: true, nome: result.nome, temContratoAtivo: result.temContratoAtivo })
}
