import { motion } from "framer-motion";
import { Database, RotateCw } from "lucide-react";
import type { ReactNode } from "react";
import type { Fonte, Nivel } from "../lib/types";
import { useContador } from "../lib/hooks";
import { COR_NIVEL, TEXTO_NIVEL } from "./nivel";

/** Rótulo de seção editorial: "01  Agora em São Paulo". */
export function Rotulo({ n, children, className = "" }: { n?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`flex items-baseline gap-3 font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted ${className}`}>
      {n && <span className="tabular-nums text-petrol-600">{n}</span>}
      <span>{children}</span>
    </div>
  );
}

/** Selo discreto exibido sempre que a fonte dos dados é SIMULADO. */
export function SeloFonte({ fonte, className = "" }: { fonte: Fonte | undefined; className?: string }) {
  if (!fonte) return null;
  if (fonte === "ORACLE")
    return (
      <span className={`inline-flex items-center gap-1.5 text-[13px] text-ink-muted ${className}`}>
        <Database size={13} aria-hidden /> Oracle
      </span>
    );
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-rule-strong/70 bg-paper-card px-2.5 py-0.5 text-[12.5px] font-medium text-ink-muted ${className}`}
      title="Os dados desta tela são simulados para demonstração. Não representam medições reais."
    >
      <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" aria-hidden />
      Dados simulados
    </span>
  );
}

export function Numero({ valor, casas = 0, className = "" }: { valor: number; casas?: 0 | 1; className?: string }) {
  const v = useContador(valor);
  return (
    <span className={`tabular-nums ${className}`}>
      {v.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas })}
    </span>
  );
}

export function Esqueleto({ className = "" }: { className?: string }) {
  return <div className={`esqueleto rounded-md ${className}`} aria-hidden />;
}

export function EstadoErro({ mensagem, aoTentar }: { mensagem: string; aoTentar?: () => void }) {
  return (
    <div role="alert" className="border-l-2 border-ink py-2 pl-4">
      <p className="font-display text-[15px] font-semibold text-ink">Não deu para carregar agora.</p>
      <p className="mt-1 text-[15px] text-ink-muted">{mensagem}</p>
      {aoTentar && (
        <button onClick={aoTentar} className="botao-linha mt-3">
          <RotateCw size={14} aria-hidden /> Tentar de novo
        </button>
      )}
    </div>
  );
}

/** Medidor circular de pontuação (0–100), animado. */
export function Medidor({ pontuacao, nivel, tamanho = 180 }: { pontuacao: number; nivel: Nivel; tamanho?: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const arco = 0.75; // 270 graus
  const frac = Math.max(0, Math.min(1, pontuacao / 100));
  const v = useContador(pontuacao);
  return (
    <div className="relative shrink-0" style={{ width: tamanho, height: tamanho }}>
      <svg viewBox="0 0 100 100" className="h-full w-full rotate-[135deg]" role="img" aria-label={`Pontuação ${Math.round(pontuacao)} de 100`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E4E0D6" strokeWidth="6" strokeDasharray={`${c * arco} ${c}`} strokeLinecap="round" />
        {[25, 50, 75].map((m) => {
          const ang = ((m / 100) * 270 * Math.PI) / 180;
          return (
            <line
              key={m}
              x1={50 + (r - 5) * Math.cos(ang)}
              y1={50 + (r - 5) * Math.sin(ang)}
              x2={50 + (r + 5) * Math.cos(ang)}
              y2={50 + (r + 5) * Math.sin(ang)}
              stroke="#F4F2EC"
              strokeWidth="1.6"
            />
          );
        })}
        <motion.circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={COR_NIVEL[nivel]}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${c * arco} ${c}`}
          initial={{ strokeDashoffset: c * arco }}
          animate={{ strokeDashoffset: c * arco * (1 - frac) }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-bold leading-none tracking-[-0.04em] tabular-nums" style={{ fontSize: tamanho * (Number.isInteger(pontuacao) ? 0.3 : 0.24), color: TEXTO_NIVEL[nivel] }}>
          {Number.isInteger(pontuacao) ? Math.round(v) : v.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
        </span>
        <span className="mt-1 text-[12px] font-medium uppercase tracking-[0.14em] text-ink-muted">de 100</span>
      </div>
    </div>
  );
}

/** Linha fina de escala dos 4 níveis com o ponto marcando a pontuação. */
export function EscalaRisco({ pontuacao, compacta = false }: { pontuacao: number; compacta?: boolean }) {
  const faixas: { nivel: Nivel; de: number; ate: number; rot: string }[] = [
    { nivel: "BAIXO", de: 0, ate: 25, rot: "Baixo" },
    { nivel: "MODERADO", de: 25, ate: 50, rot: "Moderado" },
    { nivel: "ALTO", de: 50, ate: 75, rot: "Alto" },
    { nivel: "CRITICO", de: 75, ate: 100, rot: "Crítico" },
  ];
  return (
    <div className="w-full">
      <div className="relative flex h-1.5 gap-[3px]">
        {faixas.map((f) => (
          <div key={f.nivel} className="h-full flex-1 rounded-full" style={{ background: COR_NIVEL[f.nivel], opacity: 0.85 }} />
        ))}
        <motion.div
          className="absolute -top-[5px] h-4 w-4 -translate-x-1/2 rounded-full border-[3px] border-paper-card bg-ink shadow"
          initial={{ left: "0%" }}
          animate={{ left: `${Math.min(100, Math.max(0, pontuacao))}%` }}
          transition={{ duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
        />
      </div>
      {!compacta && (
        <div className="mt-2.5 flex text-[12px] font-medium text-ink-muted">
          {faixas.map((f) => (
            <span key={f.nivel} className="flex-1">
              {f.rot} <span className="tabular-nums text-ink-faint">{f.de}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export const entrada = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.2, 0.7, 0.2, 1] },
};
