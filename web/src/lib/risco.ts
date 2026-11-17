// Regras de risco portadas de processamento/calcular_risco.py e app/alertas.py.
// Usadas SOMENTE para gerar os dados simulados do front (mock) de forma coerente
// com a API; com a API real, nível, pontuação e textos vêm do servidor.
import type { Indicadores, Nivel, Regiao } from "./types";

export const ORDEM_NIVEIS: Nivel[] = ["BAIXO", "MODERADO", "ALTO", "CRITICO"];

export const PESO_CHUVA = 0.5;
export const PESO_VENTO = 0.2;
export const PESO_HISTORICO = 0.3;

const PESO_GRAVIDADE: Record<string, number> = { BAIXA: 5, MEDIA: 10, ALTA: 20, CRITICA: 30 };

export const MEDIDAS: Record<Nivel, string[]> = {
  BAIXO: ["Nenhuma ação necessária. Acompanhe a previsão do dia."],
  MODERADO: [
    "Fique atento à previsão nas próximas horas.",
    "Evite deixar objetos soltos em áreas abertas.",
  ],
  ALTO: [
    "Evite áreas de alagamento e encostas.",
    "Deixe documentos e itens importantes em local alto.",
    "Prefira transporte seguro e evite atravessar ruas alagadas.",
  ],
  CRITICO: [
    "Procure um local seguro e elevado imediatamente.",
    "Não atravesse ruas alagadas nem áreas de deslizamento.",
    "Em emergência, ligue 199 (Defesa Civil) ou 193 (Bombeiros).",
  ],
};

export function pontuacaoChuva(mm: number): number {
  if (mm <= 1) return 0;
  if (mm <= 5) return 20;
  if (mm <= 15) return 50;
  if (mm <= 30) return 75;
  return 100;
}

export function pontuacaoVento(kmh: number): number {
  if (kmh <= 20) return 0;
  if (kmh <= 40) return 25;
  if (kmh <= 60) return 50;
  if (kmh <= 80) return 75;
  return 100;
}

export function nivelPorPontuacao(p: number): Nivel {
  if (p < 25) return "BAIXO";
  if (p < 50) return "MODERADO";
  if (p < 75) return "ALTO";
  return "CRITICO";
}

export function pontosHistoricos(gravidades: string[]): number {
  const total = gravidades.reduce((s, g) => s + (PESO_GRAVIDADE[g] ?? 0), 0);
  return Math.min(total, 100);
}

export function pontuar(chuva: number, vento: number, historico: number): number {
  const p =
    pontuacaoChuva(chuva) * PESO_CHUVA +
    pontuacaoVento(vento) * PESO_VENTO +
    Math.min(historico, 100) * PESO_HISTORICO;
  return Math.round(p * 100) / 100;
}

export function motivo(chuva: number, vento: number, ocorrencias: number, nivel: Nivel): string {
  const fatores: string[] = [];
  if (pontuacaoChuva(chuva) >= 50) fatores.push(`chuva de ${chuva.toFixed(1)} mm`);
  if (pontuacaoVento(vento) >= 50) fatores.push(`vento de até ${vento.toFixed(0)} km/h`);
  if (ocorrencias >= 3) fatores.push(`${ocorrencias} ocorrências registradas na região`);
  if (fatores.length && (nivel === "ALTO" || nivel === "CRITICO"))
    return "Risco elevado por " + fatores.join(" e ") + ".";
  if (fatores.length) return "Pontos de atenção: " + fatores.join(" e ") + ".";
  return `Chuva de ${chuva.toFixed(1)} mm e vento de até ${vento.toFixed(0)} km/h; ${ocorrencias} ocorrência(s) no histórico.`;
}

export function ordenar<T extends { nivel: Nivel; pontuacao: number }>(lista: T[]): T[] {
  return [...lista].sort(
    (a, b) =>
      ORDEM_NIVEIS.indexOf(b.nivel) - ORDEM_NIVEIS.indexOf(a.nivel) || b.pontuacao - a.pontuacao,
  );
}

/** Indicadores do painel calculados no cliente (usado no tour sem sessão). */
export function indicadoresDe(regioes: Regiao[]): Indicadores {
  return {
    regioes: regioes.length,
    em_alerta: regioes.filter((r) => r.nivel === "ALTO" || r.nivel === "CRITICO").length,
    chuva_max_mm: Math.max(0, ...regioes.map((r) => r.chuva_mm ?? 0)),
    vento_max_kmh: Math.max(0, ...regioes.map((r) => r.vento_kmh ?? 0)),
    ocorrencias: regioes.reduce((s, r) => s + r.ocorrencias, 0),
  };
}

export function contagemPorNivel(regioes: { nivel: Nivel }[]): Record<Nivel, number> {
  const c: Record<Nivel, number> = { BAIXO: 0, MODERADO: 0, ALTO: 0, CRITICO: 0 };
  regioes.forEach((r) => (c[r.nivel] += 1));
  return c;
}
