import type { Nivel } from "./types";

const NOMES: Record<string, string> = { Butanta: "Butantã" };

/** Nome de exibição do bairro (o dado vem sem acento, ex.: "Butanta"). */
export function nomeBairro(nome: string): string {
  return NOMES[nome] ?? nome;
}

/** Chave sem acento e minúscula para comparar nomes ("Butantã" == "butanta"). */
export function chave(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export const ROTULO_NIVEL: Record<Nivel, string> = {
  BAIXO: "Baixo",
  MODERADO: "Moderado",
  ALTO: "Alto",
  CRITICO: "Crítico",
};

const nf1 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

export function num(v: number | null | undefined, casas: 0 | 1 = 1): string {
  if (v === null || v === undefined || Number.isNaN(v)) return "—";
  return casas === 1 ? nf1.format(v) : nf0.format(v);
}

export function hora(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

/** Cor fixa por bairro nos gráficos (não confunde com as cores de risco). */
export const COR_BAIRRO: Record<string, string> = {
  Centro: "#475569",
  Mooca: "#0EA5E9",
  Ipiranga: "#8B5CF6",
  "Vila Mariana": "#DB2777",
  Butanta: "#0D9488",
};

export function corBairro(nome: string): string {
  return COR_BAIRRO[nome] ?? "#64748B";
}

/** Textos da API vêm com decimal em ponto ("28.1 mm"); exibe em pt-BR ("28,1 mm"). */
export function textoBr(t: string): string {
  return t.replace(/(\d)\.(\d)/g, "$1,$2");
}
