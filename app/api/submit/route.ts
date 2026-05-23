import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch(
      'https://webhook.fluenzosoluntions.com.br/webhook/pre-cadastro-netcom',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }
    )

    const result = await response.json()
    return NextResponse.json(result)
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Erro ao enviar' },
      { status: 500 }
    )
  }
}
