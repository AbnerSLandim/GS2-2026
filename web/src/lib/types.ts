// Contrato JSON (docs/PLANO_FRONT_REACT.md). Front e API seguem exatamente isto.

export type Nivel = "BAIXO" | "MODERADO" | "ALTO" | "CRITICO";
export type Fonte = "ORACLE" | "SIMULADO";

export interface Regiao {
  nome: string;
  lat: number;
  lon: number;
  nivel: Nivel;
  pontuacao: number;
  chuva_mm: number | null;
  vento_kmh: number | null;
  ocorrencias: number;
  data_analise: string | null;
  alerta: { motivo: string; medidas: string[] };
}

export interface RegioesResposta {
  fonte: Fonte;
  atualizado_em: string;
  regioes: Regiao[];
}

export interface Indicadores {
  regioes: number;
  em_alerta: number;
  chuva_max_mm: number;
  vento_max_kmh: number;
  ocorrencias: number;
}

export interface PainelResposta extends RegioesResposta {
  indicadores: Indicadores;
}

export interface Leitura {
  data: string;
  regiao: string;
  chuva_mm: number;
  vento_kmh: number;
}

export interface SensoresResposta {
  fonte: Fonte;
  leituras: Leitura[];
}

export interface Me {
  autenticado: boolean;
  auth_configurada: boolean;
}

export interface RiscoAoVivo {
  nome: string;
  nivel: Nivel;
  pontuacao: number;
  chuva_24h_mm: number;
  vento_max_kmh: number;
}

export interface EventoLeituras {
  tick: number;
  momento: string;
  total: number;
  novas: Leitura[];
  risco: RiscoAoVivo[];
}

/** GET /api/indicadores (seção 4.2) — módulo de Big Data. */
export interface IndicadoresResposta {
  fonte: Fonte;
  ranking: { nome: string; pontuacao: number; nivel: Nivel }[];
  evolucao: { data: string | null; regiao: string; pontuacao: number | null; variacao: number | null; tendencia: string | null }[];
  previsao: { data: string | null; regiao: string; chuva_mm: number | null; temperatura: number | null; umidade: number | null; vento_kmh: number | null }[];
  ocorrencias: { regiao: string; gravidade: string; total: number }[];
}

export type LoginResultado =
  | { ok: true }
  | { ok: false; status: 401 | 429 | 503 | number; erro: string; tentar_em_s?: number };
