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
    vencimentos: ["5"],
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
    vencimentos: ["5", "10"],
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
    vencimentos: ["5"],
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
