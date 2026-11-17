import { motion } from "framer-motion";
import type { Indicadores, Regiao } from "../lib/types";
import { nomeBairro, num, textoBr } from "../lib/format";
import { COR_NIVEL, MarcaNivel, SeloNivel, TEXTO_NIVEL } from "../components/nivel";
import { Numero, Rotulo } from "../components/ui";

interface Props {
  indicadores: Indicadores;
  regioes: Regiao[];
}

export function VisaoGeralView({ indicadores, regioes }: Props) {
  const pior = regioes[0];
  const maisChuva = [...regioes].sort((a, b) => (b.chuva_mm ?? 0) - (a.chuva_mm ?? 0))[0];
  const maisVento = [...regioes].sort((a, b) => (b.vento_kmh ?? 0) - (a.vento_kmh ?? 0))[0];
  const ocorrMax = [...regioes].sort((a, b) => b.ocorrencias - a.ocorrencias)[0];

  return (
    <div className="space-y-12">
      {/* Manchete: números como protagonistas */}
      <section className="grid gap-10 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <Rotulo n="01">Situação agora</Rotulo>
          <div className="mt-5 flex items-end gap-5">
            <span className="numero-display text-[132px] text-ink md:text-[168px]">
              <Numero valor={indicadores.em_alerta} />
            </span>
            <div className="pb-4">
              <p className="font-display text-[28px] font-bold leading-none tracking-[-0.03em] text-ink-faint md:text-[36px]">
                de {indicadores.regioes}
              </p>
              <p className="mt-2 font-display text-[19px] font-semibold tracking-[-0.02em] md:text-[22px]">regiões em alerta</p>
              <p className="text-[14px] text-ink-muted">nível alto ou crítico</p>
            </div>
          </div>
          {pior && (
            <p className="mt-6 max-w-[620px] text-[19px] leading-relaxed text-ink-soft">
              <span className="font-semibold" style={{ color: TEXTO_NIVEL[pior.nivel] }}>
                {nomeBairro(pior.nome)}
              </span>{" "}
              concentra o maior risco, com pontuação {num(pior.pontuacao, 1)} de 100. {textoBr(pior.alerta.motivo)}
            </p>
          )}
        </div>
        <dl className="grid content-end gap-0 sm:grid-cols-3 xl:col-span-5 xl:grid-cols-1">
          {[
            { rot: "Maior chuva prevista", v: indicadores.chuva_max_mm, u: "mm", casas: 1 as const, onde: maisChuva },
            { rot: "Vento máximo", v: indicadores.vento_max_kmh, u: "km/h", casas: 0 as const, onde: maisVento },
            { rot: "Ocorrências no histórico", v: indicadores.ocorrencias, u: "", casas: 0 as const, onde: ocorrMax },
          ].map((k) => (
            <div key={k.rot} className="flex items-end justify-between gap-4 border-t border-rule py-4 sm:pr-4 xl:pr-0">
              <div>
                <dt className="text-[14px] text-ink-muted">{k.rot}</dt>
                {k.onde && (
                  <dd className="mt-0.5 text-[13px] text-ink-faint">
                    {k.u ? "em " : "mais em "}
                    {nomeBairro(k.onde.nome)}
                  </dd>
                )}
              </div>
              <dd className="flex items-baseline gap-1.5">
                <span className="numero-display text-[46px] text-ink">
                  <Numero valor={k.v} casas={k.casas} />
                </span>
                {k.u && <span className="font-display text-[15px] font-semibold text-ink-muted">{k.u}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Ranking */}
      <section className="folha p-6 md:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <Rotulo n="02">Ranking de risco</Rotulo>
          <span className="text-[13px] text-ink-muted">Pontuação de 0 a 100 · chuva 50%, vento 20%, histórico 30%</span>
        </div>
        <ol className="mt-6 space-y-4">
          {regioes.map((r, i) => (
            <li key={r.nome} className="grid grid-cols-[28px_minmax(110px,170px)_1fr_64px] items-center gap-4 md:grid-cols-[28px_200px_1fr_72px_120px]">
              <span className="font-display text-[14px] font-semibold tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
              <span className="truncate font-display text-[16px] font-semibold tracking-[-0.015em]">{nomeBairro(r.nome)}</span>
              <div className="relative h-7 rounded-[4px] bg-paper-deep">
                {[25, 50, 75].map((m) => (
                  <span key={m} className="absolute top-0 h-full w-px bg-paper" style={{ left: `${m}%` }} aria-hidden />
                ))}
                <motion.div
                  className="h-full rounded-[4px]"
                  style={{ background: COR_NIVEL[r.nivel] }}
                  initial={{ width: 0 }}
                  animate={{ width: `${r.pontuacao}%` }}
                  transition={{ duration: 0.9, delay: 0.08 * i, ease: [0.2, 0.7, 0.2, 1] }}
                />
              </div>
              <span className="text-right font-display text-[20px] font-bold tabular-nums tracking-[-0.03em]">{num(r.pontuacao, 1)}</span>
              <span className="hidden md:block">
                <SeloNivel nivel={r.nivel} tamanho="sm" />
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* Tabela */}
      <section>
        <Rotulo n="03">Detalhe por região</Rotulo>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-[15.5px]">
            <thead>
              <tr className="border-b-2 border-ink text-[12.5px] uppercase tracking-[0.1em] text-ink-muted">
                <th className="py-3 pr-4 font-display font-semibold">Região</th>
                <th className="py-3 pr-4 font-display font-semibold">Nível</th>
                <th className="py-3 pr-4 text-right font-display font-semibold">Pontuação</th>
                <th className="py-3 pr-4 text-right font-display font-semibold">Chuva 24 h</th>
                <th className="py-3 pr-4 text-right font-display font-semibold">Vento máx.</th>
                <th className="py-3 text-right font-display font-semibold">Ocorrências</th>
              </tr>
            </thead>
            <tbody>
              {regioes.map((r) => (
                <tr key={r.nome} className="border-b border-rule transition-colors hover:bg-paper-card">
                  <td className="py-3.5 pr-4 font-semibold">{nomeBairro(r.nome)}</td>
                  <td className="py-3.5 pr-4">
                    <MarcaNivel nivel={r.nivel} />
                  </td>
                  <td className="py-3.5 pr-4 text-right tabular-nums">{num(r.pontuacao, 1)}</td>
                  <td className="py-3.5 pr-4 text-right tabular-nums">{num(r.chuva_mm, 1)} mm</td>
                  <td className="py-3.5 pr-4 text-right tabular-nums">{num(r.vento_kmh, 0)} km/h</td>
                  <td className="py-3.5 text-right tabular-nums">{r.ocorrencias}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
