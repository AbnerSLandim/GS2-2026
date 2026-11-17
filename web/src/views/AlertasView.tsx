import { motion } from "framer-motion";
import { Check, Phone } from "lucide-react";
import type { Regiao } from "../lib/types";
import { dataHora, nomeBairro, num, textoBr } from "../lib/format";
import { COR_NIVEL, FUNDO_NIVEL, RESUMO_NIVEL, SeloNivel, TEXTO_NIVEL } from "../components/nivel";

export function AlertasView({ regioes, atualizadoEm }: { regioes: Regiao[]; atualizadoEm?: string }) {
  if (!regioes.length)
    return <p className="py-16 text-center text-ink-muted">Nenhum alerta no momento. As regiões monitoradas estão sem análise de risco.</p>;

  return (
    <ol className="space-y-5">
      {regioes.map((r, i) => {
        const grave = r.nivel === "ALTO" || r.nivel === "CRITICO";
        return (
          <motion.li
            key={r.nome}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.06 * i }}
            className="relative overflow-hidden rounded-2xl border border-rule bg-paper-card"
          >
            <span className="absolute inset-y-0 left-0 w-1.5" style={{ background: COR_NIVEL[r.nivel] }} aria-hidden />
            <div className="grid gap-6 p-6 pl-8 md:grid-cols-12 md:gap-8 md:p-7 md:pl-9">
              <div className="md:col-span-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-[13px] font-semibold tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                  <SeloNivel nivel={r.nivel} tamanho="sm" />
                </div>
                <h3 className={`mt-3 font-bold tracking-[-0.03em] ${i === 0 ? "text-[30px]" : "text-[24px]"}`}>{nomeBairro(r.nome)}</h3>
                <p className="mt-1 text-[14.5px] font-medium" style={{ color: TEXTO_NIVEL[r.nivel] }}>
                  {RESUMO_NIVEL[r.nivel]}
                </p>
                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="numero-display text-[40px]" style={{ color: TEXTO_NIVEL[r.nivel] }}>
                    {num(r.pontuacao, 1)}
                  </span>
                  <span className="text-[13px] text-ink-muted">/ 100</span>
                </p>
              </div>
              <div className="md:col-span-5">
                <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Motivo</p>
                <p className="mt-2 text-[17px] leading-relaxed text-ink-soft">{textoBr(r.alerta.motivo)}</p>
                <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[14px] text-ink-muted">
                  <div>
                    <dt className="inline">Chuva </dt>
                    <dd className="inline font-semibold tabular-nums text-ink">{num(r.chuva_mm, 1)} mm</dd>
                  </div>
                  <div>
                    <dt className="inline">Vento </dt>
                    <dd className="inline font-semibold tabular-nums text-ink">{num(r.vento_kmh, 0)} km/h</dd>
                  </div>
                  <div>
                    <dt className="inline">Ocorrências </dt>
                    <dd className="inline font-semibold tabular-nums text-ink">{r.ocorrencias}</dd>
                  </div>
                </dl>
              </div>
              <div className="md:col-span-4">
                <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">O que fazer</p>
                <ul className="mt-2 space-y-2">
                  {r.alerta.medidas.map((m) => (
                    <li key={m} className="flex gap-2.5 text-[15.5px] leading-snug text-ink-soft">
                      <span
                        className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px]"
                        style={{ background: FUNDO_NIVEL[r.nivel], color: TEXTO_NIVEL[r.nivel] }}
                        aria-hidden
                      >
                        <Check size={12} strokeWidth={3} />
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
                {grave && (
                  <p className="mt-4 inline-flex items-center gap-2 text-[14px] text-ink-muted">
                    <Phone size={14} aria-hidden /> <b className="tabular-nums text-ink">199</b> Defesa Civil · <b className="tabular-nums text-ink">193</b> Bombeiros
                  </p>
                )}
              </div>
            </div>
            <div className="border-t border-rule px-8 py-2.5 text-[13px] text-ink-faint md:pl-9">
              {r.data_analise ? `Análise de ${dataHora(r.data_analise)}` : `Calculado na consulta${atualizadoEm ? `, ${dataHora(atualizadoEm)}` : ""}`}
            </div>
          </motion.li>
        );
      })}
    </ol>
  );
}
