export interface Plan {
  v: string
  p: string
}

export interface CityData {
  vencimentos: string[]
  bairros: Record<string, Plan[]>
}

const planosCovanca: Plan[] = [
  { v: "300MB", p: "R$ 120,00" },
  { v: "500MB", p: "R$ 140,00" },
  { v: "600MB", p: "R$ 160,00" },
  { v: "800MB", p: "R$ 180,00" },
]

export const DATA: Record<string, CityData> = {
  "São Gonçalo": {
    vencimentos: ["5", "20"],
    bairros: {
      "Santa Catarina": [
        { v: "350MB", p: "R$ 120,00" },
        { v: "450MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 180,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
      "Barro Vermelho": [
        { v: "350MB", p: "R$ 120,00" },
        { v: "450MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 180,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
      "Sete Pontes": [
        { v: "350MB", p: "R$ 120,00" },
        { v: "450MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 180,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
      "Covanca": [
        { v: "350MB", p: "R$ 120,00" },
        { v: "450MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 180,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
      "Pita": [
        { v: "350MB", p: "R$ 120,00" },
        { v: "450MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 180,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
    }
  },
  "Duque de Caxias": {
    vencimentos: ["5", "20"],
    bairros: {
      "Cangulo": [
        { v: "400MB", p: "R$ 120,00" },
        { v: "500MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 170,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
      "Jardim Rosário": [
        { v: "400MB", p: "R$ 120,00" },
        { v: "500MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 170,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
      "Saracuruna": [
        { v: "400MB", p: "R$ 120,00" },
        { v: "500MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 170,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
    }
  },
  "Rio de Janeiro": {
    vencimentos: ["5", "20"],
    bairros: {
      "Caju": [
        { v: "350MB", p: "R$ 120,00" },
        { v: "450MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 180,00" },
        { v: "800MB", p: "R$ 200,00" }
      ],
      "Santo Cristo": [
        { v: "50MB",  p: "R$ 100,00" },
        { v: "100MB", p: "R$ 150,00" },
        { v: "150MB", p: "R$ 200,00" },
        { v: "200MB", p: "R$ 250,00" },
      ],
      "Cavalcante": [
        { v: "200MB", p: "R$ 59,90" },
        { v: "400MB", p: "R$ 69,90" },
        { v: "600MB", p: "R$ 94,90" }
      ],
      // Região Covanca — POP 42
      "Tanque":       planosCovanca,
      "Jacarepaguá":  planosCovanca,
      "Pechincha":    planosCovanca,
      "Taquara":      planosCovanca,
    }
  },
  "Queimados": {
    vencimentos: ["5", "20"],
    bairros: {
      "Queimados": [
        { v: "300MB", p: "R$ 100,00" },
        { v: "500MB", p: "R$ 120,00" },
        { v: "600MB", p: "R$ 150,00" },
        { v: "800MB", p: "R$ 180,00" }
      ],
    }
  }
}

// ── Vencimentos por bairro (exceções) — fallback: vencimentos da cidade ─────
// Região Covanca (POP 42) opera com dias 5, 10, 15 e 20 — NÃO ofertar 25 e 30
export const VENCIMENTOS_BAIRRO: Record<string, string[]> = {
  "Rio de Janeiro|Tanque":      ["5", "10", "15", "20"],
  "Rio de Janeiro|Jacarepaguá": ["5", "10", "15", "20"],
  "Rio de Janeiro|Pechincha":   ["5", "10", "15", "20"],
  "Rio de Janeiro|Taquara":     ["5", "10", "15", "20"],
}

export function getVencimentos(cidade: string, bairro: string): string[] {
  return VENCIMENTOS_BAIRRO[`${cidade}|${bairro}`] ?? DATA[cidade]?.vencimentos ?? []
}

// ── Mapeamento POP + Portador + NAS por cidade/bairro ───────────────────────
export interface PopPortador {
  pop_id: number
  portador_id: number
  nas: string
}

const BAIRROS_POP42 = new Set(["Tanque", "Jacarepaguá", "Pechincha", "Taquara"])

export function getPopPortador(cidade: string, bairro: string): PopPortador {
  if (cidade === "Rio de Janeiro") {
    if (BAIRROS_POP42.has(bairro))
      return { pop_id: 42, portador_id: 30, nas: "BNG-ACCELPPP-VYOS-GEN11" }
    // Demais bairros do Rio — POP 31 / Portador 30
    return { pop_id: 31, portador_id: 30, nas: "BNG-ACCELPPP-VYOS-GEN11" }
  }
  if (cidade === "Queimados")
    return { pop_id: 39, portador_id: 34, nas: "BNG-ACCELPPP-VYOS-GEN11" }
  if (cidade === "Duque de Caxias")
    return { pop_id: 38, portador_id: 33, nas: "BNG-ACCELPPP-VYOS-GEN11" }
  return { pop_id: 1, portador_id: 32, nas: "BNG-ACCELPPP-VYOS-GEN11" }
}

// ── Mapeamento plano_id SGP por cidade/bairro/velocidade ───────────────────
type PlanoKey = string // `${cidade}|${bairro}|${velocidade}`

const PLANO_MAP: Record<PlanoKey, number> = {
  // São Gonçalo — POP 1
  "São Gonçalo||350MB": 7,
  "São Gonçalo||450MB": 8,
  "São Gonçalo||600MB": 9,
  "São Gonçalo||800MB": 1238,

  // Duque de Caxias — POP 38
  "Duque de Caxias||400MB": 228,
  "Duque de Caxias||500MB": 229,
  "Duque de Caxias||600MB": 230,
  "Duque de Caxias||800MB": 231,

  // Rio de Janeiro — Caju — POP 31
  "Rio de Janeiro|Caju|350MB": 1239,
  "Rio de Janeiro|Caju|450MB": 1240,
  "Rio de Janeiro|Caju|600MB": 1241,
  "Rio de Janeiro|Caju|800MB": 1242,

  // Rio de Janeiro — Santo Cristo — POP 31
  "Rio de Janeiro|Santo Cristo|50MB":  193,
  "Rio de Janeiro|Santo Cristo|100MB": 194,
  "Rio de Janeiro|Santo Cristo|150MB": 195,
  "Rio de Janeiro|Santo Cristo|200MB": 196,

  // Rio de Janeiro — Cavalcante/Cavalcanti — POP 31
  "Rio de Janeiro|Cavalcante|200MB":  209,
  "Rio de Janeiro|Cavalcante|400MB":  210,
  "Rio de Janeiro|Cavalcante|600MB":  211,
  "Rio de Janeiro|Cavalcanti|200MB":  209,
  "Rio de Janeiro|Cavalcanti|400MB":  210,
  "Rio de Janeiro|Cavalcanti|600MB":  211,

  // Rio de Janeiro — Região Covanca (Tanque, Jacarepaguá, Pechincha, Taquara) — POP 42
  "Rio de Janeiro|Tanque|300MB":      101312,
  "Rio de Janeiro|Tanque|500MB":      1248,
  "Rio de Janeiro|Tanque|600MB":      1249,
  "Rio de Janeiro|Tanque|800MB":      1250,
  "Rio de Janeiro|Jacarepaguá|300MB": 101312,
  "Rio de Janeiro|Jacarepaguá|500MB": 1248,
  "Rio de Janeiro|Jacarepaguá|600MB": 1249,
  "Rio de Janeiro|Jacarepaguá|800MB": 1250,
  "Rio de Janeiro|Pechincha|300MB":   101312,
  "Rio de Janeiro|Pechincha|500MB":   1248,
  "Rio de Janeiro|Pechincha|600MB":   1249,
  "Rio de Janeiro|Pechincha|800MB":   1250,
  "Rio de Janeiro|Taquara|300MB":     101312,
  "Rio de Janeiro|Taquara|500MB":     1248,
  "Rio de Janeiro|Taquara|600MB":     1249,
  "Rio de Janeiro|Taquara|800MB":     1250,

  // Queimados — POP 39
  "Queimados||300MB": 1243,
  "Queimados||500MB": 1244,
  "Queimados||600MB": 1245,
  "Queimados||800MB": 1246,
}

export function getPlanoId(cidade: string, bairro: string, velocidade: string): number {
  const keyBairro = `${cidade}|${bairro}|${velocidade}`
  if (PLANO_MAP[keyBairro]) return PLANO_MAP[keyBairro]

  const keyCidade = `${cidade}||${velocidade}`
  if (PLANO_MAP[keyCidade]) return PLANO_MAP[keyCidade]

  return 7 // fallback — São Gonçalo 350MB
}