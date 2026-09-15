import { NextResponse } from 'next/server'

function capitalizeName(name: string): string {
  return name
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export async function POST(request: Request) {
  try {
    const { tipo, valor } = await request.json() as { tipo: string; valor: string }

    if (!tipo || !valor) {
      return NextResponse.json({ found: false, message: 'Parâmetros inválidos' }, { status: 400 })
    }

    const app = process.env.SGP_APP ?? ''
    const token = process.env.SGP_TOKEN ?? ''
    const base = process.env.SGP_BASE_URL ?? 'https://netecom.sgplocal.com.br'

    // Monta o filtro conforme o tipo
    const body: Record<string, string> = { app, token, status: '1' }

    if (tipo === 'cpf') {
      const cpfLimpo = valor.replace(/\D/g, '')
      if (cpfLimpo.length !== 11) {
        return NextResponse.json({ found: false, message: 'CPF inválido' }, { status: 400 })
      }
      body.cpfcnpj = cpfLimpo
    } else if (tipo === 'email') {
      body.email = valor.trim().toLowerCase()
    } else if (tipo === 'telefone') {
      const telLimpo = valor.replace(/\D/g, '')
      if (telLimpo.length < 10) {
        return NextResponse.json({ found: false, message: 'Telefone inválido' }, { status: 400 })
      }
      body.telefone = telLimpo
    } else {
      return NextResponse.json({ found: false, message: 'Tipo inválido' }, { status: 400 })
    }

    // Consulta SGP via URA consultacliente — busca contratos ativos
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const sgpRes = await fetch(`${base}/api/ura/consultacliente/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout))

    const data = await sgpRes.json() as Record<string, unknown>
    console.log('[MGM VALIDAR-INDICADOR]', tipo, valor, JSON.stringify(data).slice(0, 200))

    // Resposta do SGP: { msg: "Contrato(s) Localizado(s)", contratos: [...] }
    const contratos = data.contratos as Array<Record<string, unknown>> | undefined

    if (!contratos || contratos.length === 0) {
      return NextResponse.json({ found: false, message: 'Não encontramos esse cadastro na nossa base.' })
    }

    // Pega o primeiro contrato ativo
    const contrato = contratos.find(c => {
      const status = String(c.contratoStatus ?? c.contrato_status ?? '')
      return status === '1' || status.toLowerCase().includes('ativo')
    }) ?? contratos[0]

    const nomeCompleto = String(contrato.razaoSocial ?? contrato.cliente ?? data.cliente ?? '')
    const clienteId = contrato.clienteId ?? contrato.cliente_id ?? null
    const cpfCnpj = String(contrato.cpfCnpj ?? '')

    if (!nomeCompleto) {
      return NextResponse.json({ found: false, message: 'Cadastro não encontrado.' })
    }

    const primeiroNome = capitalizeName(nomeCompleto.split(' ')[0])

    return NextResponse.json({
      found: true,
      primeiro_nome: primeiroNome,
      nome_completo: capitalizeName(nomeCompleto),
      cliente_id: clienteId,
      cpf: cpfCnpj.replace(/\D/g, ''),
    })
  } catch (err) {
    console.error('[MGM VALIDAR-INDICADOR ERROR]', err)
    return NextResponse.json({ found: false, message: 'Erro ao consultar. Tente novamente.' }, { status: 500 })
  }
}
