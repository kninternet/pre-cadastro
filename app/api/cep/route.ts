import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const authHeader = request.headers.get('authorization') ?? ''
  const secret = process.env.WEBHOOK_SECRET ?? ''
  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ status: 'error', message: 'Não autorizado' }, { status: 401 })
  }

  const cep = searchParams.get('cep')?.replace(/\D/g, '')

  if (!cep || cep.length !== 8) {
    return NextResponse.json({ error: 'CEP inválido' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = await response.json()

    if (data.erro) {
      return NextResponse.json({ error: 'CEP não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      logradouro: data.logradouro || '',
      bairro: data.bairro || '',
      cidade: data.localidade || '',
      uf: data.uf || '',
      complemento: data.complemento || '',
    })
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar CEP' }, { status: 500 })
  }
}