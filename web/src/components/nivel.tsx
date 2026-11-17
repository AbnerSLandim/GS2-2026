import { CircleCheck, CircleAlert, TriangleAlert, OctagonAlert, type LucideIcon } from "lucide-react";
import type { Nivel } from "../lib/types";
import { ROTULO_NIVEL } from "../lib/format";

export const COR_NIVEL: Record<Nivel, string> = {
  BAIXO: "#16A34A",
  MODERADO: "#CA8A04",
  ALTO: "#EA580C",
  CRITICO: "#DC2626",
};

/** Texto legível (AA) sobre papel/branco na cor do nível. */
export const TEXTO_NIVEL: Record<Nivel, string> = {
  BAIXO: "#15803D",
  MODERADO: "#946405",
  ALTO: "#B9440A",
  CRITICO: "#B91C1C",
};

export const FUNDO_NIVEL: Record<Nivel, string> = {
  BAIXO: "#ECF7EF",
  MODERADO: "#FBF5E1",
  ALTO: "#FCF0E7",
  CRITICO: "#FBEDEC",
};

export const ICONE_NIVEL: Record<Nivel, LucideIcon> = {
  BAIXO: CircleCheck,
  MODERADO: CircleAlert,
  ALTO: TriangleAlert,
  CRITICO: OctagonAlert,
};

export const RESUMO_NIVEL: Record<Nivel, string> = {
  BAIXO: "Sem risco relevante agora.",
  MODERADO: "Atenção nas próximas horas.",
  ALTO: "Risco alto. Prepare-se.",
  CRITICO: "Risco crítico. Aja agora.",
};

interface SeloProps {
  nivel: Nivel;
  tamanho?: "sm" | "md" | "lg";
  className?: string;
}

/** Selo de nível: sempre texto + ícone, nunca só cor. */
export function SeloNivel({ nivel, tamanho = "md", className = "" }: SeloProps) {
  const Icone = ICONE_NIVEL[nivel];
  const t = {
    sm: "text-[12px] px-2 py-0.5 gap-1",
    md: "text-[13px] px-2.5 py-1 gap-1.5",
    lg: "text-[15px] px-3 py-1.5 gap-2",
  }[tamanho];
  const i = { sm: 12, md: 14, lg: 17 }[tamanho];
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full font-display font-semibold uppercase tracking-[0.06em] ${t} ${className}`}
      style={{ color: TEXTO_NIVEL[nivel], background: FUNDO_NIVEL[nivel], boxShadow: `inset 0 0 0 1px ${COR_NIVEL[nivel]}33` }}
    >
      <Icone size={i} strokeWidth={2.4} aria-hidden />
      {ROTULO_NIVEL[nivel]}
    </span>
  );
}

/** Marcador pequeno (traço de cor + texto) para tabelas e listas densas. */
export function MarcaNivel({ nivel }: { nivel: Nivel }) {
  const Icone = ICONE_NIVEL[nivel];
  return (
    <span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: TEXTO_NIVEL[nivel] }}>
      <Icone size={15} strokeWidth={2.4} aria-hidden />
      {ROTULO_NIVEL[nivel]}
    </span>
  );
}
