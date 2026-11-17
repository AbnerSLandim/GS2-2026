import { Link } from "react-router-dom";

export function Marca({ tamanho = 28, cor = "#0E5966", onda = "#F4F2EC" }: { tamanho?: number; cor?: string; onda?: string }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden>
      <path d="M16 3.5c4.6 5.4 8.4 10.2 8.4 14.7a8.4 8.4 0 0 1-16.8 0c0-4.5 3.8-9.3 8.4-14.7z" fill={cor} />
      <path d="M10.6 19.6c1.8-1.3 3.6-1.3 5.4 0s3.6 1.3 5.4 0" stroke={onda} strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M11.8 23.2c1.4-.9 2.8-.9 4.2 0s2.8.9 4.2 0" stroke={onda} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity=".7" />
    </svg>
  );
}

export function Logo({ para = "/", claro = false }: { para?: string; claro?: boolean }) {
  return (
    <Link to={para} className="group inline-flex items-center gap-2.5 rounded-md" aria-label="AlertaClima, início">
      <Marca cor={claro ? "#F4F2EC" : "#0E5966"} onda={claro ? "#0B4A55" : "#F4F2EC"} />
      <span className={`font-display text-[19px] font-bold tracking-[-0.03em] ${claro ? "text-paper" : "text-ink"}`}>
        Alerta<span className={claro ? "text-petrol-100" : "text-petrol-600"}>Clima</span>
      </span>
    </Link>
  );
}
