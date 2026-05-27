import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function POST(request: Request) {
  let body: Record<string, string>

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ status: 'error', message: 'Payload inválido' }, { status: 400 })
  }

  const { lead_id, nome, cpf, email, whatsapp, telefone_fixo, telefone_residencial } = body

  if (!lead_id || !nome || !cpf || !email || !whatsapp) {
    return NextResponse.json({ status: 'error', message: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  try {
    await pool.query(
      `UPDATE leads SET
        nome = $1,
        cpf = $2,
        email = $3,
        whatsapp = $4,
        telefone_fixo = $5,
        telefone_residencial = $6,
        step_atual = 2
      WHERE id = $7`,
      [
        nome,
        cpf.replace(/\D/g, ''),
        email,
        whatsapp.replace(/\D/g, ''),
        telefone_fixo ?? null,
        telefone_residencial ?? null,
        parseInt(lead_id),
      ]
    )
    return NextResponse.json({ status: 'success' })
  } catch (err) {
    console.error('[STEP2 ERROR]', err)
    return NextResponse.json({ status: 'error', message: 'Erro ao salvar Step 2' }, { status: 500 })
  }
}
