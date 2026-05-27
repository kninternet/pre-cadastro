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

  const { session_id, cidade, bairro, plano, vencimento, aceita_taxa_instalacao } = body

  if (!session_id || !cidade || !bairro || !plano || !vencimento || aceita_taxa_instalacao === undefined) {
    return NextResponse.json({ status: 'error', message: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const [plano_velocidade, plano_preco] = plano.split(' - ').map((s: string) => s.trim())

  try {
    const { rows } = await pool.query(
      `INSERT INTO leads (
        session_id,
        cidade_cobertura, bairro_cobertura,
        plano_velocidade, plano_preco,
        vencimento, aceita_taxa_instalacao,
        step_atual
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING id`,
      [
        session_id,
        cidade, bairro,
        plano_velocidade, plano_preco ?? '',
        vencimento, aceita_taxa_instalacao === 'true' || aceita_taxa_instalacao === true,
        1,
      ]
    )
    return NextResponse.json({ status: 'success', lead_id: rows[0].id })
  } catch (err) {
    console.error('[STEP1 ERROR]', err)
    return NextResponse.json({ status: 'error', message: 'Erro ao salvar Step 1' }, { status: 500 })
  }
}
