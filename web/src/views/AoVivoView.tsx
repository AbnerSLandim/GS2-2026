import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { assinarStream, type OrigemStream } from "../lib/api";
import type { EventoLeituras, Leitura, RiscoAoVivo } from "../lib/types";
import { corBairro, hora, nomeBairro, num, ROTULO_NIVEL } from "../lib/format";
import { COR_NIVEL, FUNDO_NIVEL, ICONE_NIVEL, TEXTO_NIVEL } from "../components/nivel";
import { Numero, Rotulo } from "../components/ui";

const BAIRROS = ["Butanta", "Ipiranga", "Mooca", "Vila Mariana", "Centro"];
const PONTOS = 36;

type Ponto = { t: string } & Record<string, number | string>;

export function AoVivoView({ origem, compacto = false }: { origem: OrigemStream; compacto?: boolean }) {
  const [status, setStatus] = useState<"conectando" | "ao_vivo" | "erro">("conectando");
  const [ultimo, setUltimo] = useState<EventoLeituras | null>(null);
  const [serie, setSerie] = useState<Ponto[]>([]);
  const [feed, setFeed] = useState<(Leitura & { id: string })[]>([]);
  const inicial = useRef<Record<string, RiscoAoVivo> | null>(null);

  useEffect(() => {
    setStatus("conectando");
    const parar = assinarStream(
      origem,
      (e) => {
        setStatus("ao_vivo");
        setUltimo(e);
        if (!inicial.current) inicial.current = Object.fromEntries(e.risco.map((r) => [r.nome, r]));
        const p: Ponto = { t: hora(e.momento) };
        e.novas.forEach((l) => (p[l.regiao] = l.chuva_mm));
        setSerie((s) => [...s, p].slice(-PONTOS));
        setFeed((f) => [...e.novas.map((l) => ({ ...l, id: `${e.tick}-${l.regiao}` })), ...f].slice(0, 10));
      },
      () => setStatus("erro"),
    );
    return parar;
  }, [origem]);

  const risco = ultimo?.risco ?? [];
  const emAlerta = risco.filter((r) => r.nivel === "ALTO" || r.nivel === "CRITICO").length;
  const chuvaAgora = Math.max(0, ...(ultimo?.novas.map((n) => n.chuva_mm) ?? [0]));

  return (
    <div className="space-y-8">
      {/* faixa de status + contadores */}
      <section className="grid gap-6 border-b border-rule pb-8 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3" role="status" aria-live="polite">
            {status === "ao_vivo" ? (
              <span className="inline-flex items-center gap-2.5 rounded-full bg-ink px-3 py-1 font-display text-[12.5px] font-bold uppercase tracking-[0.16em] text-paper">
                <span className="pulso relative h-2 w-2 rounded-full bg-[#5EEAD4] text-[#5EEAD4]" aria-hidden />
                Ao vivo
              </span>
            ) : status === "conectando" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-3 py-1 text-[13px] font-semibold text-ink-muted">
                Conectando aos sensores…
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full border border-rule-strong px-3 py-1 text-[13px] font-semibold text-ink-muted">
                Transmissão encerrada
              </span>
            )}
            <span className="text-[13px] text-ink-muted">Sensores simulados</span>
          </div>
          <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-ink-soft">
            Cada bairro envia uma leitura de chuva e vento por hora simulada. O risco é recalculado a cada leitura, com a janela das últimas 24 h.
          </p>
          {status === "erro" && (
            <p className="mt-3 text-[14px] text-ink-muted">A conexão com o servidor caiu. Recarregue a página para retomar.</p>
          )}
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 md:col-span-8 md:grid-cols-4">
          {[
            { rot: "Leituras recebidas", v: ultimo?.total ?? 0, u: "", c: 0 as const },
            { rot: "Hora simulada", v: null, txt: ultimo ? hora(ultimo.momento) : "—" },
            { rot: "Maior chuva na hora", v: chuvaAgora, u: "mm", c: 1 as const },
            { rot: "Regiões em alerta", v: emAlerta, u: `de ${risco.length || 5}`, c: 0 as const },
          ].map((k) => (
            <div key={k.rot} className="border-l border-rule pl-4">
              <dt className="text-[13.5px] text-ink-muted">{k.rot}</dt>
              <dd className="mt-2 flex items-baseline gap-1.5">
                <span className="numero-display text-[44px] text-ink">
                  {k.v === null ? <span className="tabular-nums">{k.txt}</span> : <Numero valor={k.v} casas={k.c} />}
                </span>
                {k.u && <span className="font-display text-[14px] font-semibold text-ink-muted">{k.u}</span>}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* risco por bairro, mudando ao vivo */}
      <section>
        <Rotulo n="01">Risco recalculado por bairro</Rotulo>
        <ul className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {BAIRROS.map((nome) => {
            const r = risco.find((x) => x.nome === nome);
            const ini = inicial.current?.[nome];
            const nivel = r?.nivel ?? "BAIXO";
            const I = ICONE_NIVEL[nivel];
            const mudou = r && ini && r.nivel !== ini.nivel;
            return (
              <motion.li
                key={nome}
                layout
                className="relative overflow-hidden rounded-xl border px-4 pb-4 pt-5"
                animate={{ backgroundColor: r ? FUNDO_NIVEL[nivel] : "#FBFAF7", borderColor: r ? `${COR_NIVEL[nivel]}55` : "#DCD8CD" }}
                transition={{ duration: 0.6 }}
              >
                <motion.span className="absolute inset-x-0 top-0 h-1" animate={{ backgroundColor: r ? COR_NIVEL[nivel] : "#DCD8CD" }} aria-hidden />
                <p className="font-display text-[15px] font-semibold tracking-[-0.015em]">{nomeBairro(nome)}</p>
                {r ? (
                  <>
                    <p className="mt-1 flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: TEXTO_NIVEL[nivel] }}>
                      <I size={14} aria-hidden /> {ROTULO_NIVEL[nivel]}
                      {mudou && <span className="font-medium text-ink-muted">· era {ROTULO_NIVEL[ini.nivel].toLowerCase()}</span>}
                    </p>
                    <p className="mt-3 numero-display text-[38px]" style={{ color: TEXTO_NIVEL[nivel] }}>
                      <Numero valor={r.pontuacao} casas={1} />
                    </p>
                    <p className="mt-2 text-[13px] tabular-nums text-ink-muted">
                      {num(r.chuva_24h_mm, 1)} mm em 24 h · {num(r.vento_max_kmh, 0)} km/h
                    </p>
                  </>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="esqueleto h-4 w-16 rounded" />
                    <div className="esqueleto h-9 w-20 rounded" />
                  </div>
                )}
              </motion.li>
            );
          })}
        </ul>
      </section>

      <section className={`grid gap-6 ${compacto ? "xl:grid-cols-[1fr_360px]" : "xl:grid-cols-[1fr_380px]"}`}>
        <div className="folha p-5 md:p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <Rotulo n="02">Chuva por hora, por bairro · mm</Rotulo>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-soft">
              {BAIRROS.map((b) => (
                <li key={b} className="flex items-center gap-1.5">
                  <span className="h-[3px] w-4 rounded-full" style={{ background: corBairro(b) }} aria-hidden />
                  {nomeBairro(b)}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4" style={{ height: compacto ? 250 : 320 }}>
            {serie.length < 2 ? (
              <div className="esqueleto h-full w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={serie} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                  <CartesianGrid vertical={false} stroke="#E4E0D6" strokeDasharray="2 4" />
                  <XAxis dataKey="t" tick={{ fontSize: 12, fill: "#5B5F66" }} tickLine={false} axisLine={{ stroke: "#C4BFB1" }} minTickGap={28} />
                  <YAxis
                    tick={{ fontSize: 12, fill: "#5B5F66" }}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    allowDecimals={false}
                    domain={[0, (m: number) => Math.max(1, Math.ceil(m))]}
                  />
                  <Tooltip
                    contentStyle={{ background: "#FBFAF7", border: "1px solid #DCD8CD", borderRadius: 10, fontSize: 13, boxShadow: "0 12px 32px -16px rgba(20,23,28,.25)" }}
                    labelStyle={{ fontWeight: 600, color: "#14171C" }}
                    formatter={(v: number, n: string) => [`${v.toLocaleString("pt-BR")} mm`, nomeBairro(n)]}
                  />
                  {BAIRROS.map((b) => (
                    <Line
                      key={b}
                      type="monotone"
                      dataKey={b}
                      stroke={corBairro(b)}
                      strokeWidth={b === "Butanta" ? 2.6 : 1.8}
                      dot={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="folha flex flex-col p-5 md:p-6">
          <Rotulo n="03">Últimas leituras</Rotulo>
          <ul className="mt-3 flex-1 overflow-hidden" aria-live="off">
            {feed.length === 0 && <li className="py-6 text-[14px] text-ink-muted">Aguardando a primeira leitura…</li>}
              {feed.map((l) => (
                <motion.li
                  key={l.id}
                  initial={{ backgroundColor: "#E3EEEF" }}
                  animate={{ backgroundColor: "rgba(227,238,239,0)" }}
                  transition={{ duration: 1.4 }}
                  className="grid grid-cols-[46px_1fr_auto] items-center gap-3 border-b border-rule py-2 text-[14px] last:border-0"
                >
                  <span className="tabular-nums text-ink-faint">{hora(l.data)}</span>
                  <span className="flex items-center gap-2 font-medium text-ink-soft">
                    <span className="h-2 w-2 rounded-full" style={{ background: corBairro(l.regiao) }} aria-hidden />
                    {nomeBairro(l.regiao)}
                  </span>
                  <span className="tabular-nums text-ink">
                    {num(l.chuva_mm, 1)} mm <span className="text-ink-faint">·</span> {num(l.vento_kmh, 0)} km/h
                  </span>
                </motion.li>
              ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default AoVivoView;
