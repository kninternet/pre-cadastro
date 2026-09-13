import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

const MALE_NAMES = ["Lucas","Pedro","Rafael","Bruno","Carlos","André","Thiago","Marcos","Felipe","Gabriel","Henrique","Diego","Leandro","Gustavo","Vinícius","Matheus","Leonardo","Eduardo","Daniel","Jorge","Fábio","Sérgio","Renato","Paulo","Ricardo","Fernando","Alexandre","Márcio","Roberto","Antônio"]
const FEMALE_NAMES = ["Ana","Juliana","Fernanda","Camila","Patrícia","Larissa","Bianca","Carla","Amanda","Bruna","Tatiana","Renata","Daniela","Letícia","Priscila","Vanessa","Aline","Natália","Isabela","Mariana","Cláudia","Adriana","Simone","Cristina","Lúcia","Gabriela","Raquel","Michele","Mônica","Regina"]

function detectGender(name: string): 'M' | 'F' {
  const n = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  return ['a','ia','na','ina','ela','ila','ane','ene','ice','ude'].some(e => n.endsWith(e)) ? 'F' : 'M'
}

function generateQuiz(realName: string): string[] {
  const gender = detectGender(realName)
  const pool = (gender === 'F' ? FEMALE_NAMES : MALE_NAMES)
    .filter(n => n.toLowerCase() !== realName.toLowerCase())
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 4)
  return [...shuffled, realName].sort(() => Math.random() - 0.5)
}

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
    let filtro = ''
    if (tipo === 'cpf') {
      const cpfLimpo = valor.replace(/\D/g, '')
      if (cpfLimpo.length !== 11) {
        return NextResponse.json({ found: false, message: 'CPF inválido' }, { status: 400 })
      }
      filtro = `"cpfcnpj": "${cpfLimpo}"`
    } else if (tipo === 'email') {
      filtro = `"email": "${valor.trim().toLowerCase()}"`
    } else if (tipo === 'telefone') {
      const telLimpo = valor.replace(/\D/g, '')
      if (telLimpo.length < 10) {
        return NextResponse.json({ found: false, message: 'Telefone inválido' }, { status: 400 })
      }
      filtro = `"telefone": "${telLimpo}"`
    } else {
      return NextResponse.json({ found: false, message: 'Tipo inválido' }, { status: 400 })
    }

    // Consulta SGP via URA consultacliente — busca contratos ativos
    const payload = `{"app":"${app}","token":"${token}",${filtro},"status":"1"}`

    const { stdout } = await execAsync(
      `curl -s -X POST '${base}/api/ura/consultacliente/' -H 'Content-Type: application/json' -d '${payload}'`,
      { timeout: 8000 }
    )

    const data = JSON.parse(stdout) as Record<string, unknown>
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
    const quiz = generateQuiz(primeiroNome)

    return NextResponse.json({
      found: true,
      primeiro_nome: primeiroNome,
      cliente_id: clienteId,
      cpf: cpfCnpj.replace(/\D/g, ''),
      quiz_options: quiz,
    })
  } catch (err) {
    console.error('[MGM VALIDAR-INDICADOR ERROR]', err)
    return NextResponse.json({ found: false, message: 'Erro ao consultar. Tente novamente.' }, { status: 500 })
  }
}
