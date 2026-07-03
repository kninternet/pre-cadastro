import { NextResponse } from 'next/server'
import { buscarCep } from '@/lib/sgp-client'

/**
 * Rota INTERNA — consumida apenas pelo próprio front-end (step-3, atendimento).
 * Sem Bearer, mesmo motivo do /api/internal/check-cpf.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const cep = searchParams.get('cep') ?? ''
  const result = await buscarCep(cep)

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status })
  }

  return NextResponse.json({
    logradouro: result.logradouro,
    bairro: result.bairro,
    cidade: result.cidade,
    uf: result.uf,
    complemento: result.complemento,
  })
}
