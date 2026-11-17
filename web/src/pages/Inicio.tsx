import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Search } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PaginaPublica } from "../components/Site";
import { Isobaras } from "../components/Isobaras";
import { COR_NIVEL, ICONE_NIVEL, TEXTO_NIVEL } from "../components/nivel";
import { Esqueleto, EstadoErro, Rotulo, SeloFonte } from "../components/ui";
import { api } from "../lib/api";
import { useRecurso } from "../lib/hooks";
import { contagemPorNivel, ORDEM_NIVEIS } from "../lib/risco";
import { hora, nomeBairro, num, ROTULO_NIVEL } from "../lib/format";
import type { Nivel, RegioesResposta } from "../lib/types";

const FRASE_NIVEL: Record<Nivel, [string, string]> = {
  CRITICO: ["região em risco crítico", "regiões em risco crítico"],
  ALTO: ["região em risco alto", "regiões em risco alto"],
  MODERADO: ["região em atenção", "regiões em atenção"],
  BAIXO: ["região sem risco relevante", "regiões sem risco relevante"],
};

function Boletim({ dados }: { dados: RegioesResposta }) {
  const c = contagemPorNivel(dados.regioes);
  const topo = [...ORDEM_NIVEIS].reverse().find((n) => c[n] > 0) ?? "BAIXO";
  return (
    <div className="relative rounded-2xl border border-rule bg-paper-card/95 p-6 shadow-lift md:p-7">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Boletim · São Paulo</p>
        <span className="text-[13px] tabular-nums text-ink-muted">Atualizado às {hora(dados.atualizado_em)}</span>
      </div>
      <p className="mt-5 flex items-baseline gap-3">
        <span className="numero-display text-[72px]" style={{ color: TEXTO_NIVEL[topo] }}>
          {c[topo]}
        </span>
        <span className="font-display text-[20px] font-semibold leading-tight tracking-[-0.02em]">{FRASE_NIVEL[topo][c[topo] === 1 ? 0 : 1]}</span>
      </p>
      <p className="mt-1 text-[14.5px] text-ink-muted">
        {dados.regioes.length} regiões monitoradas ·{" "}
        {ORDEM_NIVEIS.slice()
          .reverse()
          .filter((n) => c[n] && n !== topo)
          .map((n) => `${c[n]} ${ROTULO_NIVEL[n].toLowerCase()}`)
          .join(" · ")}
      </p>

      <div className="mt-5 flex h-2 gap-[3px]" aria-hidden>
        {dados.regioes.map((r, i) => (
          <motion.span
            key={r.nome}
            className="h-full flex-1 origin-left rounded-full"
            style={{ background: COR_NIVEL[r.nivel] }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3 + i * 0.07, duration: 0.5 }}
          />
        ))}
      </div>

      <ol className="mt-5">
        {dados.regioes.map((r) => {
          const I = ICONE_NIVEL[r.nivel];
          return (
            <li key={r.nome} className="border-t border-rule first:border-0">
              <Link
                to={`/meu-bairro?bairro=${encodeURIComponent(r.nome)}`}
                className="group flex items-center gap-3 py-2.5 transition-colors"
              >
                <span className="min-w-0 flex-1 font-display text-[15.5px] font-semibold tracking-[-0.015em] group-hover:underline group-hover:decoration-rule-strong group-hover:underline-offset-4">
                  {nomeBairro(r.nome)}
                </span>
                <span className="flex w-[112px] items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: TEXTO_NIVEL[r.nivel] }}>
                  <I size={14} aria-hidden /> {ROTULO_NIVEL[r.nivel]}
                </span>
                <span className="w-10 text-right font-display text-[17px] font-bold tabular-nums">{num(r.pontuacao, 0)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center justify-between border-t border-rule pt-4">
        <SeloFonte fonte={dados.fonte} />
        <span className="text-[12.5px] text-ink-faint">pontuação de 0 a 100</span>
      </div>
    </div>
  );
}

function BuscaBairro() {
  const [q, setQ] = useState("");
  const navegar = useNavigate();
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    navegar(q.trim() ? `/meu-bairro?bairro=${encodeURIComponent(q.trim())}` : "/meu-bairro");
  };
  return (
    <form onSubmit={enviar} className="flex w-full max-w-[520px] items-center gap-2 rounded-full border border-rule-strong bg-paper-card p-1.5 pl-5 shadow-card focus-within:border-petrol-600">
      <Search size={18} className="shrink-0 text-ink-muted" aria-hidden />
      <label htmlFor="busca-inicio" className="sr-only">
        Nome do seu bairro
      </label>
      <input
        id="busca-inicio"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Seu bairro, ex.: Butantã"
        className="min-w-0 flex-1 bg-transparent py-2 text-[16.5px] placeholder:text-ink-faint focus:outline-none"
        autoComplete="off"
      />
      <button type="submit" className="botao shrink-0">
        Ver<span className="hidden sm:inline"> meu bairro</span> <ArrowRight size={16} aria-hidden />
      </button>
    </form>
  );
}

export default function Inicio() {
  const { dados, erro, recarregar } = useRecurso("regioes", api.regioes);
  const { hash } = useLocation();
  // âncoras (/#como-funciona): o router não rola sozinho
  useEffect(() => {
    if (!hash) return;
    const t = window.setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => window.clearTimeout(t);
  }, [hash, !!dados || !!erro]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PaginaPublica>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-rule">
        <Isobaras className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.85]" cx={0.8} cy={0.42} linhas={16} />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,#F4F2EC_0%,#F4F2EC_38%,rgba(244,242,236,0.55)_62%,rgba(244,242,236,0)_100%)]" aria-hidden />
        <div className="relative mx-auto grid max-w-[1320px] gap-12 px-5 pb-16 pt-12 md:px-10 md:pb-24 md:pt-20 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-petrol-700"
            >
              Risco de enchente, alagamento e deslizamento
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.5 }}
              className="mt-5 text-[52px] font-extrabold leading-[0.95] tracking-[-0.05em] sm:text-[72px] lg:text-[100px]"
            >
              Saiba antes
              <br />
              da água
              <br />
              <span className="text-petrol-600">chegar.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mt-7 max-w-[540px] text-[19px] leading-relaxed text-ink-soft md:text-[21px]"
            >
              A previsão do tempo diz que vai chover. O AlertaClima diz se o <em className="not-italic font-semibold text-ink">seu bairro</em> corre
              risco, por quê, e o que fazer antes.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="mt-9">
              <BuscaBairro />
              <a href="#como-funciona" className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-medium text-ink-muted hover:text-ink">
                Como o risco é calculado <ArrowDown size={15} aria-hidden />
              </a>
            </motion.div>
          </div>
          <motion.div
            className="lg:col-span-5 lg:pt-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {dados ? (
              <Boletim dados={dados} />
            ) : erro ? (
              <div className="folha p-6">
                <EstadoErro mensagem={erro.message} aoTentar={recarregar} />
              </div>
            ) : (
              <div className="folha space-y-4 p-7">
                <Esqueleto className="h-4 w-40" />
                <Esqueleto className="h-16 w-56" />
                <Esqueleto className="h-2 w-full" />
                {[0, 1, 2, 3, 4].map((i) => (
                  <Esqueleto key={i} className="h-6 w-full" />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="como-funciona" className="mx-auto max-w-[1320px] scroll-mt-8 px-5 pt-20 md:px-10 md:pt-28">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Rotulo n="01">Como funciona</Rotulo>
            <h2 className="mt-4 text-[36px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[46px]">Três dados, uma resposta clara.</h2>
            <p className="mt-4 max-w-sm text-[17px] text-ink-muted">
              A mesma regra é usada no painel da Defesa Civil e na tela do cidadão. Não existe uma conta para cada público.
            </p>
          </div>
          <ol className="grid gap-0 lg:col-span-8 lg:grid-cols-3">
            {[
              {
                t: "Previsão e histórico",
                d: "Chuva e vento previstos para as próximas 24 h, cruzados com as ocorrências que o bairro já teve.",
                peso: [
                  ["Chuva", 50],
                  ["Vento", 20],
                  ["Histórico", 30],
                ] as [string, number][],
              },
              {
                t: "Pontuação de 0 a 100",
                d: "Cada fator vira pontos e entra com o seu peso. Bairros que já alagaram pesam mais.",
              },
              {
                t: "Nível, motivo e o que fazer",
                d: "De baixo a crítico, com a explicação em linguagem simples e as medidas para aquele nível.",
              },
            ].map((p, i) => (
              <li key={p.t} className="border-t-2 border-ink pt-5 lg:pr-8 [&:not(:first-child)]:mt-10 lg:[&:not(:first-child)]:mt-0">
                <span className="numero-display text-[64px] text-petrol-600">{i + 1}</span>
                <h3 className="mt-4 text-[20px] font-bold tracking-[-0.025em]">{p.t}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-muted">{p.d}</p>
                {p.peso && (
                  <div className="mt-5 space-y-1.5">
                    {p.peso.map(([n, v]) => (
                      <div key={n} className="flex items-center gap-3 text-[13.5px]">
                        <span className="w-16 text-ink-soft">{n}</span>
                        <span className="h-1.5 rounded-full bg-petrol-600" style={{ width: `${v * 1.6}px` }} aria-hidden />
                        <span className="font-display font-semibold tabular-nums">{v}%</span>
                      </div>
                    ))}
                  </div>
                )}
                {i === 1 && (
                  <svg viewBox="0 0 200 60" className="mt-5 w-full max-w-[220px]" aria-hidden>
                    {[0, 1, 2, 3].map((k) => (
                      <rect key={k} x={k * 50 + 1} y={40} width={47} height={6} rx={3} fill={COR_NIVEL[ORDEM_NIVEIS[k]]} />
                    ))}
                    <circle cx={155} cy={43} r={7} fill="#14171C" stroke="#F4F2EC" strokeWidth={3} />
                    <text x={155} y={26} textAnchor="middle" fontFamily="Montserrat Variable" fontWeight={700} fontSize={18} fill="#14171C">
                      77,5
                    </text>
                  </svg>
                )}
                {i === 2 && (
                  <ul className="mt-5 space-y-1.5">
                    {[...ORDEM_NIVEIS].reverse().map((n) => {
                      const I = ICONE_NIVEL[n];
                      return (
                        <li key={n} className="flex items-center gap-2 text-[14px] font-semibold" style={{ color: TEXTO_NIVEL[n] }}>
                          <I size={15} aria-hidden /> {ROTULO_NIVEL[n]}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ODS */}
      <section className="mx-auto max-w-[1320px] px-5 pt-24 md:px-10 md:pt-32">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Rotulo n="02">Por que importa</Rotulo>
            <h2 className="mt-4 text-[36px] font-bold leading-[1.05] tracking-[-0.04em] md:text-[46px]">Informação antes do problema.</h2>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-rule bg-rule sm:grid-cols-2 lg:col-span-8">
            {[
              {
                n: "11",
                cor: "#FD9D24",
                t: "Cidades e comunidades sustentáveis",
                d: "Moradores sabem o risco do próprio bairro. A Defesa Civil enxerga onde priorizar a ação.",
              },
              {
                n: "13",
                cor: "#3F7E44",
                t: "Ação contra a mudança global do clima",
                d: "Chuvas extremas estão mais frequentes. Avisar cedo reduz perdas e salva vidas.",
              },
            ].map((o) => (
              <div key={o.n} className="bg-paper-card p-7 md:p-9">
                <div className="flex items-start gap-4">
                  <span className="numero-display text-[84px] text-ink">{o.n}</span>
                  <span className="mt-2 font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">
                    <span className="mb-1.5 block h-1 w-8 rounded-full" style={{ background: o.cor }} aria-hidden />
                    ODS da ONU
                  </span>
                </div>
                <h3 className="mt-5 text-[21px] font-bold leading-tight tracking-[-0.025em]">{o.t}</h3>
                <p className="mt-2 text-[16px] leading-relaxed text-ink-muted">{o.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEFESA CIVIL */}
      <section className="mx-auto max-w-[1320px] px-5 pt-24 md:px-10 md:pt-32">
        <div className="relative overflow-hidden rounded-2xl bg-petrol-900 px-7 py-12 text-paper md:px-14 md:py-16">
          <Isobaras className="pointer-events-none absolute -right-40 top-0 h-full w-[900px] opacity-60" cx={0.6} cy={0.5} linhas={11} chuva={false} cor="#7FA9AF" />
          <div className="relative max-w-[620px]">
            <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-petrol-100">Para a Defesa Civil</p>
            <h2 className="mt-4 text-[32px] font-bold leading-[1.08] tracking-[-0.035em] text-paper md:text-[42px]">
              Mapa, alertas e sensores ao vivo em um só painel.
            </h2>
            <p className="mt-4 text-[17px] leading-relaxed text-petrol-100">
              Acesso com senha para operadores. Veja onde agir primeiro e acompanhe o risco mudando a cada leitura.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <Link to="/painel" className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 font-display text-[14.5px] font-semibold text-petrol-900 hover:bg-white">
                Entrar no painel <ArrowRight size={16} aria-hidden />
              </Link>
              <Link to="/sobre" className="font-display text-[14.5px] font-semibold text-paper underline decoration-petrol-300 underline-offset-[5px] hover:decoration-paper">
                Ver a arquitetura
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PaginaPublica>
  );
}
