// lib/coverage-translation.ts
// Tradução dos slugs usados pelo site-next (kninternet/site-next, lib/coverage-data.ts)
// para os nomes literais e chaves usados internamente pelo pre-cadastro (lib/data.ts).
//
// Isto é uma CÓPIA CONTROLADA, não um pacote compartilhado — decisão tomada em
// sessão de dev para evitar overengineering (dois repos, deploy manual, sem CI
// de publicação de pacote). Sempre que a cobertura mudar em coverage-data.ts,
// replicar manualmente aqui.

export const CIDADE_SLUG_TO_NOME: Record<string, string> = {
  "sao-goncalo": "São Gonçalo",
  "rio-de-janeiro": "Rio de Janeiro",
  "queimados": "Queimados",
  "duque-de-caxias": "Duque de Caxias",
}

export const BAIRRO_SLUG_TO_NOME: Record<string, string> = {
  "santa-catarina": "Santa Catarina",
  "barro-vermelho": "Barro Vermelho",
  "sete-pontes": "Sete Pontes",
  "covanca": "Covanca",
  "pita": "Pita",
  "caju": "Caju",
  "santo-cristo": "Santo Cristo",
  "cavalcante": "Cavalcante",
  "vila-santa-clara": "Vila Santa Clara (Taquara)",
  "queimados": "Queimados",
  "cangulo": "Cangulo",
  "jardim-rosario": "Jardim Rosário",
  "saracuruna": "Saracuruna",
}

// Réplica dos valores de velocidade/preço de coverage-data.ts — usada só para
// reconstruir a chave de plano no formato que o pre-cadastro usa internamente
// ("350MB - R$ 120,00"). Fonte de verdade de preço/velocidade continua sendo
// coverage-data.ts (site-next); aqui é só espelho pra montar a chave.
export const PLANO_SLUG_TO_VELOCIDADE_PRECO: Record<string, { velocidade: number; preco: number }> = {
  "sg-350": { velocidade: 350, preco: 120.00 },
  "sg-450": { velocidade: 450, preco: 150.00 },
  "sg-600": { velocidade: 600, preco: 180.00 },
  "sg-800": { velocidade: 800, preco: 200.00 },

  "rj-caju-350": { velocidade: 350, preco: 120.00 },
  "rj-caju-450": { velocidade: 450, preco: 150.00 },
  "rj-caju-600": { velocidade: 600, preco: 180.00 },
  "rj-caju-800": { velocidade: 800, preco: 200.00 },

  "rj-sc-50":  { velocidade: 50,  preco: 100.00 },
  "rj-sc-100": { velocidade: 100, preco: 150.00 },
  "rj-sc-150": { velocidade: 150, preco: 200.00 },
  "rj-sc-200": { velocidade: 200, preco: 250.00 },

  "rj-cav-200": { velocidade: 200, preco: 59.90 },
  "rj-cav-400": { velocidade: 400, preco: 69.90 },
  "rj-cav-600": { velocidade: 600, preco: 94.90 },

  "rj-vsc-100": { velocidade: 100, preco: 79.90 },
  "rj-vsc-500": { velocidade: 500, preco: 99.90 },
  "rj-vsc-800": { velocidade: 800, preco: 149.90 },

  "que-300": { velocidade: 300, preco: 100.00 },
  "que-500": { velocidade: 500, preco: 120.00 },
  "que-600": { velocidade: 600, preco: 150.00 },
  "que-800": { velocidade: 800, preco: 180.00 },

  "dc-400": { velocidade: 400, preco: 120.00 },
  "dc-500": { velocidade: 500, preco: 150.00 },
  "dc-600": { velocidade: 600, preco: 170.00 },
  "dc-800": { velocidade: 800, preco: 200.00 },
}

/** Reconstrói a chave de plano exatamente no formato usado por DATA em lib/data.ts. */
export function formatPlanoKey(velocidade: number, preco: number): string {
  const precoFormatado = preco.toFixed(2).replace(".", ",")
  return `${velocidade}MB - R$ ${precoFormatado}`
}
