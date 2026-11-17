import { motion } from "framer-motion";
import { ArrowDownRight, ArrowRight, ArrowUpRight, Minus } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { IndicadoresResposta } from "../lib/types";
import { chave, corBairro, nomeBairro, num } from "../lib/format";
import { COR_NIVEL, SeloNivel } from "../components/nivel";
import { Rotulo } from "../components/ui";

const GRAVIDADES = ["CRITICA", "ALTA", "MEDIA", "BAIXA"] as const;
const COR_GRAV: Record<string, string> = { CRITICA: "#DC2626", ALTA: "#EA580C", MEDIA: "#CA8A04", BAIXA: "#16A34A" };
const ROT_GRAV: Record<string, string> = { CRITICA: "Crítica", ALTA: "Alta", MEDIA: "Média", BAIXA: "Baixa" };

const tooltipEstilo = {
  contentStyle: { background: "#FBFAF7", border: "1px solid #DCD8CD", borderRadius: 10, fontSize: 13, boxShadow: "0 12px 32px -16px rgba(20,23,28,.25)" },
  labelStyle: { fontWeight: 600, color: "#14171C" },
};
const eixo = { tick: { fontSize: 12, fill: "#5B5F66" }, tickLine: false };

function dia(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit" }).replace(".", "");
}

function Tendencia({ t, v }: { t: string; v: number | null }) {
  const k = chave(t);
  const sobe = k.includes("aument");
  const desce = k.includes("diminu");
  const primeira = k.includes("primeira");
  const I = sobe ? ArrowUpRight : desce ? ArrowDownRight : primeira ? Minus : ArrowRight;
  const cor = sobe ? "#B91C1C" : desce ? "#15803D" : "#5B5F66";
  const rot = sobe ? "Aumentou" : desce ? "Diminuiu" : primeira ? "Primeira análise" : "Estável";
  return (
    <span className="inline-flex items-center gap-1 text-[13.5px] font-semibold" style={{ color: cor }}>
      <I size={15} strokeWidth={2.4} aria-hidden />
      {v !== null && v !== 0 && <span className="tabular-nums">{v > 0 ? "+" : "−"}{num(Math.abs(v), 1)}</span>}
      <span className="font-medium">{rot}</span>
    </span>
  );
}

function Mini({ valores, cor }: { valores: number[]; cor: string }) {
  if (valores.length < 2) return null;
  const W = 120;
  const H = 32;
  const min = Math.min(...valores) - 2;
  const max = Math.max(...valores) + 2;
  const pts = valores.map((v, i) => [(i / (valores.length - 1)) * W, H - ((v - min) / (max - min || 1)) * H]);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const ult = pts[pts.length - 1];
  return (
    <svg viewBox={`-3 -3 ${W + 6} ${H + 6}`} className="h-8 w-[120px]" aria-hidden>
      <path d={d} fill="none" stroke={cor} strokeWidth={1.8} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={ult[0]} cy={ult[1]} r={2.8} fill={cor} />
    </svg>
  );
}

export function IndicadoresView({ dados, compacto = false }: { dados: IndicadoresResposta; compacto?: boolean }) {
  const bairros = dados.ranking.map((r) => r.nome);
  const [alvo, setAlvo] = useState<string>(bairros[0] ?? "");

  // descarta linhas incompletas (campos podem vir nulos do Oracle)
  const evolucaoValida = useMemo(
    () =>
      dados.evolucao
        .filter((e): e is typeof e & { data: string; pontuacao: number } => !!e.data && e.pontuacao !== null)
        .sort((a, b) => a.data.localeCompare(b.data)),
    [dados.evolucao],
  );

  const porRegiao = useMemo(() => {
    const m: Record<string, typeof evolucaoValida> = {};
    evolucaoValida.forEach((e) => (m[e.regiao] ??= []).push(e));
    return m;
  }, [evolucaoValida]);

  const evolucaoSerie = useMemo(() => {
    const datas = Array.from(new Set(evolucaoValida.map((e) => e.data.slice(0, 10)))).sort();
    return datas.map((d) => {
      const p: Record<string, number | string> = { d: dia(d + "T12:00:00") };
      evolucaoValida.filter((e) => e.data.startsWith(d)).forEach((e) => (p[e.regiao] = e.pontuacao));
      return p;
    });
  }, [evolucaoValida]);

  const previsao = useMemo(
    () =>
      dados.previsao
        .filter((p): p is typeof p & { data: string } => p.regiao === alvo && !!p.data)
        .sort((a, b) => a.data.localeCompare(b.data))
        .map((p) => ({
          h: new Date(p.data).toLocaleTimeString("pt-BR", { hour: "2-digit" }) + "h",
          chuva: p.chuva_mm ?? 0,
          temp: p.temperatura,
        })),
    [dados.previsao, alvo],
  );
  const chuvaTotal = previsao.slice(0, 24).reduce((s, p) => s + p.chuva, 0);
  const temps = previsao.map((p) => p.temp).filter((t): t is number => t !== null);
  const tempMax = temps.length ? Math.max(...temps) : null;
  const tempMin = temps.length ? Math.min(...temps) : null;

  const ocorr = useMemo(() => {
    const m: Record<string, Record<string, number>> = {};
    dados.ocorrencias.forEach((o) => ((m[o.regiao] ??= {})[o.gravidade.toUpperCase()] = o.total));
    const linhas = Object.entries(m).map(([regiao, g]) => ({ regiao, g, total: Object.values(g).reduce((s, x) => s + x, 0) }));
    return linhas.sort((a, b) => b.total - a.total);
  }, [dados.ocorrencias]);
  const ocorrMax = Math.max(1, ...ocorr.map((o) => o.total));
  const altGraf = compacto ? 230 : 280;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Ranking + evolução em miniatura */}
        <section className="folha p-6 xl:col-span-7">
          <div className="flex items-baseline justify-between">
            <Rotulo n="01">Ranking e tendência</Rotulo>
            <span className="text-[13px] text-ink-muted">últimos 7 dias</span>
          </div>
          <ol className="mt-4">
            {dados.ranking.map((r, i) => {
              const serie = porRegiao[r.nome] ?? [];
              const ult = serie[serie.length - 1];
              return (
                <li key={r.nome} className="grid grid-cols-[26px_1fr_auto] items-center gap-x-4 gap-y-1 border-b border-rule py-3 last:border-0 md:grid-cols-[26px_150px_120px_1fr_auto]">
                  <span className="font-display text-[13px] font-semibold tabular-nums text-ink-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="font-display text-[16px] font-semibold tracking-[-0.015em]">{nomeBairro(r.nome)}</span>
                  <span className="hidden md:block">
                    <Mini valores={serie.map((s) => s.pontuacao)} cor={COR_NIVEL[r.nivel]} />
                  </span>
                  <span className="hidden md:block">{ult && <Tendencia t={ult.tendencia ?? ""} v={ult.variacao} />}</span>
                  <span className="flex items-center gap-3 justify-self-end">
                    <span className="font-display text-[24px] font-bold tabular-nums tracking-[-0.04em]">{num(r.pontuacao, 1)}</span>
                    <span className="hidden w-[104px] sm:block">
                      <SeloNivel nivel={r.nivel} tamanho="sm" />
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-[12.5px] text-ink-faint">Variação em relação à análise anterior do mesmo bairro (função LAG no Oracle).</p>
        </section>

        {/* Ocorrências por gravidade */}
        <section className="folha p-6 xl:col-span-5">
          <Rotulo n="02">Ocorrências por bairro e gravidade</Rotulo>
          <ul className="mt-5 space-y-4">
            {ocorr.map((o, i) => (
              <li key={o.regiao}>
                <div className="flex items-baseline justify-between text-[14.5px]">
                  <span className="font-semibold">{nomeBairro(o.regiao)}</span>
                  <span className="font-display font-bold tabular-nums">{o.total}</span>
                </div>
                <div className="mt-1.5 flex h-3 overflow-hidden rounded-[3px] bg-paper-deep" role="img" aria-label={GRAVIDADES.filter((g) => o.g[g]).map((g) => `${o.g[g]} ${ROT_GRAV[g].toLowerCase()}`).join(", ")}>
                  {GRAVIDADES.filter((g) => o.g[g]).map((g) => (
                    <motion.span
                      key={g}
                      className="h-full border-r-2 border-paper-card last:border-0"
                      style={{ background: COR_GRAV[g] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(o.g[g] / ocorrMax) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.06 * i }}
                    />
                  ))}
                </div>
              </li>
            ))}
          </ul>
          <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-t border-rule pt-3 text-[13px] text-ink-muted">
            {GRAVIDADES.map((g) => (
              <li key={g} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-[2px]" style={{ background: COR_GRAV[g] }} aria-hidden />
                {ROT_GRAV[g]}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="folha p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <Rotulo n="03">Evolução do risco</Rotulo>
            <ul className="flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-ink-soft">
              {bairros.map((b) => (
                <li key={b} className="flex items-center gap-1.5">
                  <span className="h-[3px] w-3.5 rounded-full" style={{ background: corBairro(b) }} aria-hidden />
                  {nomeBairro(b)}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4" style={{ height: altGraf }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evolucaoSerie} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="#E4E0D6" strokeDasharray="2 4" />
                <XAxis dataKey="d" {...eixo} axisLine={{ stroke: "#C4BFB1" }} />
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} {...eixo} axisLine={false} width={44} />
                <Tooltip {...tooltipEstilo} formatter={(v: number, n: string) => [num(v, 1), nomeBairro(n)]} />
                {bairros.map((b) => (
                  <Line key={b} type="monotone" dataKey={b} stroke={corBairro(b)} strokeWidth={2} dot={{ r: 2.5, strokeWidth: 0, fill: corBairro(b) }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="folha p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Rotulo n="04">Previsão hora a hora · 48 h</Rotulo>
            <div className="flex flex-wrap gap-1" role="group" aria-label="Bairro da previsão">
              {bairros.map((b) => (
                <button
                  key={b}
                  onClick={() => setAlvo(b)}
                  aria-pressed={alvo === b}
                  className={`rounded-full px-2.5 py-1 text-[12.5px] font-semibold transition-colors ${
                    alvo === b ? "bg-ink text-paper" : "text-ink-muted hover:bg-paper-deep hover:text-ink"
                  }`}
                >
                  {nomeBairro(b)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-6 text-[13.5px] text-ink-muted">
            <span>
              Chuva em 24 h <b className="font-display tabular-nums text-ink">{num(chuvaTotal, 1)} mm</b>
            </span>
            <span>
              Temperatura <b className="font-display tabular-nums text-ink">{tempMin === null || tempMax === null ? "—" : `${num(tempMin, 0)}° a ${num(tempMax, 0)}°`}</b>
            </span>
          </div>
          <div className="mt-3" style={{ height: altGraf - 28 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={previsao} margin={{ top: 8, right: 0, bottom: 0, left: -16 }}>
                <CartesianGrid vertical={false} stroke="#E4E0D6" strokeDasharray="2 4" />
                <XAxis dataKey="h" {...eixo} axisLine={{ stroke: "#C4BFB1" }} interval={5} />
                <YAxis yAxisId="c" {...eixo} axisLine={false} width={44} allowDecimals={false} domain={[0, (m: number) => Math.max(1, Math.ceil(m))]} />
                <YAxis yAxisId="t" orientation="right" {...eixo} axisLine={false} width={36} domain={["dataMin - 2", "dataMax + 2"]} tickFormatter={(v: number) => `${Math.round(v)}°`} />
                <Tooltip
                  {...tooltipEstilo}
                  formatter={(v: number, n: string) => (n === "chuva" ? [`${num(v, 1)} mm`, "Chuva"] : [`${num(v, 1)} °C`, "Temperatura"])}
                />
                <Bar yAxisId="c" dataKey="chuva" fill="#1E6E7B" radius={[2, 2, 0, 0]} maxBarSize={9} />
                <Line yAxisId="t" type="monotone" dataKey="temp" stroke="#14171C" strokeWidth={1.6} strokeDasharray="4 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 flex gap-4 text-[12.5px] text-ink-muted">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[2px] bg-petrol-500" aria-hidden /> Chuva (mm)</span>
            <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t-2 border-dashed border-ink" aria-hidden /> Temperatura (°C)</span>
          </p>
        </section>
      </div>
    </div>
  );
}

export default IndicadoresView;
