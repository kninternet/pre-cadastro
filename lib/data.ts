export interface Plan {
  v: string
  p: string
}

export interface CityData {
  vencimentos: string[]
  bairros: Record<string, Plan[]>
}

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
        { v: "600MB", p: "R$ 170,00" }
      ],
      "Jardim Rosário": [
        { v: "400MB", p: "R$ 120,00" },
        { v: "500MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 170,00" }
      ],
      "Saracuruna": [
        { v: "400MB", p: "R$ 120,00" },
        { v: "500MB", p: "R$ 150,00" },
        { v: "600MB", p: "R$ 170,00" }
      ],
    }
  },
  "Rio de Janeiro": {
    vencimentos: ["5", "20"],
    bairros: {
      "Vila Santa Clara (Taquara)": [
        { v: "100MB", p: "R$ 79,90" },
        { v: "500MB", p: "R$ 99,90" },
        { v: "800MB", p: "R$ 149,90" }
      ],
      "Caju": [
        { v: "100MB", p: "R$ 110,00" },
        { v: "150MB", p: "R$ 130,00" },
        { v: "200MB", p: "R$ 160,00" },
        { v: "400MB", p: "R$ 240,00" }
      ],
      "Santo Cristo": [
        { v: "50MB", p: "R$ 100,00" },
        { v: "100MB", p: "R$ 150,00" },
        { v: "150MB", p: "R$ 200,00" },
        { v: "200MB", p: "R$ 250,00" },
        { v: "500MB", p: "R$ 400,00" }
      ],
      "Cavalcante": [
        { v: "200MB", p: "R$ 59,90" },
        { v: "400MB", p: "R$ 69,90" },
        { v: "600MB", p: "R$ 94,90" }
      ],
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

// Mapeamento de POP e Portador por cidade e bairro
export interface PopPortador {
  pop_id: number
  portador_id: number
}

export function getPopPortador(cidade: string, bairro: string): PopPortador {
  // Rio de Janeiro — mapeamento por bairro
  if (cidade === "Rio de Janeiro") {
    if (bairro === "Cavalcante") return { pop_id: 33, portador_id: 30 }
    if (bairro === "Caju" || bairro === "Santo Cristo") return { pop_id: 31, portador_id: 30 }
    return { pop_id: 34, portador_id: 30 } // Vila Santa Clara e demais
  }
  // Demais cidades — mapeamento por cidade
  if (cidade === "Queimados")      return { pop_id: 39, portador_id: 34 }
  if (cidade === "Duque de Caxias") return { pop_id: 38, portador_id: 33 }
  return { pop_id: 1, portador_id: 32 } // São Gonçalo (default)
}