import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 10000,
})

// GET — lista as oportunidades (leads abandonados: step 1 ou 2, sem submit)
export async function GET() {
  try {
    const { rows } = await pool.query(`
      SELECT DISTINCT ON (whatsapp)
        id, nome, whatsapp, email,
        cidade_cobertura, bairro_cobertura, plano_velocidade,
        step_atual, status_recuperacao, created_at
      FROM leads
      WHERE step_atual IN (1, 2)
        AND nome NOT ILIKE '%otavio%'
        AND nome NOT ILIKE '%falcone%'
        AND nome NOT ILIKE '%teste%'
        AND nome NOT ILIKE '%karina%'
        AND nome NOT ILIKE '%arthur nasser%'
        AND nome NOT ILIKE '%cimp%'
        AND nome NOT ILIKE '%alligare%'
      ORDER BY whatsapp, step_atual DESC, created_at DESC
    `)
    // Reordena: sem ação primeiro (para o atendente ver o que falta tratar)
    const sorted = rows.sort((a, b) => {
      if (!a.status_recuperacao && b.status_recuperacao) return -1
      if (a.status_recuperacao && !b.status_recuperacao) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return NextResponse.json({ leads: sorted })
  } catch (err) {
    console.error('[PIPELINE GET ERROR]', err)
    return NextResponse.json({ error: 'Erro ao buscar leads' }, { status: 500 })
  }
}

// PATCH — atualiza o status de recuperação de um lead
export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json()

    if (!id || !['convertido', 'duplicado', 'perdido', null, ''].includes(status)) {
      return NextResponse.json({ error: 'Parâmetros inválidos' }, { status: 400 })
    }

    const valorFinal = status === '' ? null : status

    await pool.query(
      `UPDATE leads SET status_recuperacao = $1 WHERE id = $2`,
      [valorFinal, id]
    )

    return NextResponse.json({ status: 'success' })
  } catch (err) {
    console.error('[PIPELINE PATCH ERROR]', err)
    return NextResponse.json({ error: 'Erro ao atualizar status' }, { status: 500 })
  }
}