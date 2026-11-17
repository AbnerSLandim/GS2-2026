import { motion } from "framer-motion";
import { Check, CloudRain, GitCommitHorizontal, House, KeyRound, MapPin, Package, ShieldCheck, Siren, TestTube, Users, Boxes } from "lucide-react";
import type { ReactNode } from "react";
import type { Passo } from "../Apresentacao";
import type { Regiao } from "../../lib/types";
import { Isobaras } from "../../components/Isobaras";
import { Marca } from "../../components/Logo";
import { COR_NIVEL, SeloNivel, TEXTO_NIVEL } from "../../components/nivel";
import { Medidor } from "../../components/ui";
import { nomeBairro, textoBr } from "../../lib/format";

const sobe = (d = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: d, ease: [0.2, 0.7, 0.2, 1] as const },
});

function Quadro({ passo, children, escuro = false }: { passo: Passo; children: ReactNode; escuro?: boolean }) {
  return (
    <section className={`relative flex min-h-screen flex-col overflow-hidden px-[7vw] py-[6vh] ${escuro ? "bg-petrol-900 text-paper" : "bg-paper"}`}>
      <header className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Marca tamanho={26} cor={escuro ? "#F4F2EC" : "#0E5966"} onda={escuro ? "#083A43" : "#F4F2EC"} />
          <span className={`font-display text-[13px] font-semibold uppercase tracking-[0.2em] ${escuro ? "text-petrol-100" : "text-petrol-700"}`}>{passo.etapa}</span>
        </div>
        <span className={`font-display text-[13px] font-medium ${escuro ? "text-petrol-100/80" : "text-ink-faint"}`}>AlertaClima · FIAP Global Solution 2026/2</span>
      </header>
      <div className="relative z-10 flex flex-1 flex-col justify-center">{children}</div>
    </section>
  );
}

function Titulo({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.h1 {...sobe(0.1)} className={`text-[clamp(44px,4.6vw,88px)] font-extrabold leading-[0.98] tracking-[-0.05em] ${className}`}>
      {children}
    </motion.h1>
  );
}

export function SlideProblema({ passo }: { passo: Passo }) {
  const icones = [CloudRain, MapPin, Users];
  return (
    <Quadro passo={passo}>
      <div className="grid grid-cols-12 items-center gap-[4vw]">
        <div className="col-span-7">
          <Titulo>
            Chove, alaga e a população descobre <span className="text-critico-text">tarde demais.</span>
          </Titulo>
          <ul className="mt-[5vh] max-w-[860px]">
            {passo.texto.map((t, i) => {
              const I = icones[i];
              return (
                <motion.li key={t} {...sobe(0.5 + i * 0.35)} className="flex items-start gap-5 border-t border-rule py-5 text-[clamp(18px,1.35vw,26px)] leading-snug text-ink-soft">
                  <I size={28} className="mt-0.5 shrink-0 text-petrol-600" aria-hidden />
                  {t}
                </motion.li>
              );
            })}
          </ul>
        </div>
        {/* uma previsão comum: diz que chove, não diz o que fazer */}
        <motion.div {...sobe(0.3)} className="col-span-5">
          <div className="relative rounded-[28px] border border-rule bg-paper-card p-10 shadow-lift">
            <p className="font-display text-[15px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Previsão do tempo</p>
            <p className="mt-2 font-display text-[40px] font-bold tracking-[-0.04em]">São Paulo</p>
            <div className="mt-6 flex items-center gap-6">
              <svg viewBox="0 0 120 100" className="h-28 w-32" aria-hidden>
                <path d="M30 62a20 20 0 0 1 4-39.6A28 28 0 0 1 88 30a17 17 0 0 1 2 33.9z" fill="#E4E0D6" />
                {[38, 56, 74, 92].map((x, i) => (
                  <line key={x} x1={x - 2} y1={70 + (i % 2) * 6} x2={x - 8} y2={88 + (i % 2) * 6} stroke="#1E6E7B" strokeWidth={4} strokeLinecap="round" />
                ))}
              </svg>
              <div>
                <p className="font-display text-[30px] font-bold leading-tight tracking-[-0.03em]">Chuva forte</p>
                <p className="text-[19px] text-ink-muted">à tarde e à noite</p>
              </div>
            </div>
            <div className="mt-8 space-y-3 border-t border-dashed border-rule-strong pt-6">
              {["A minha rua vai alagar?", "Já alagou aqui antes?", "O que eu faço agora?"].map((q, i) => (
                <motion.p key={q} {...sobe(1.4 + i * 0.5)} className="flex items-center gap-3 font-display text-[22px] font-semibold tracking-[-0.02em] text-ink-soft">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-rule-strong text-[16px] text-ink-muted">?</span>
                  {q}
                </motion.p>
              ))}
            </div>
            <p className="mt-6 text-[15px] text-ink-faint">A previsão não responde a nenhuma dessas perguntas.</p>
          </div>
        </motion.div>
      </div>
    </Quadro>
  );
}

export function SlideSolucao({ passo, regioes }: { passo: Passo; regioes: Regiao[] }) {
  const ex = regioes.find((r) => r.nome === "Butanta") ?? regioes[0];
  const pesos: [string, number][] = [
    ["Chuva prevista", 50],
    ["Vento", 20],
    ["Histórico de ocorrências", 30],
  ];
  return (
    <Quadro passo={passo}>
      <Titulo className="max-w-[1300px]">
        Risco por bairro, com <span className="text-petrol-600">motivo</span> e o que fazer.
      </Titulo>
      <div className="mt-[6vh] grid grid-cols-[1fr_auto_0.9fr_auto_1.2fr] items-stretch gap-6">
        <motion.div {...sobe(0.6)} className="rounded-2xl border border-rule bg-paper-card p-8">
          <p className="font-display text-[14px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Entram</p>
          <div className="mt-6 space-y-5">
            {pesos.map(([n, v], i) => (
              <div key={n}>
                <div className="flex justify-between text-[20px]">
                  <span className="text-ink-soft">{n}</span>
                  <span className="font-display font-bold tabular-nums">{v}%</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-paper-deep">
                  <motion.div className="h-full rounded-full bg-petrol-600" initial={{ width: 0 }} animate={{ width: `${v * 2}%` }} transition={{ delay: 0.9 + i * 0.2, duration: 0.8 }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[16px] leading-snug text-ink-muted">{passo.texto[0]}</p>
        </motion.div>
        <Seta d={1.2} />
        <motion.div {...sobe(1.4)} className="flex flex-col items-center justify-center rounded-2xl border border-rule bg-paper-card p-8">
          <p className="font-display text-[14px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Pontuação</p>
          <div className="mt-4">{ex && <Medidor pontuacao={ex.pontuacao} nivel={ex.nivel} tamanho={220} />}</div>
          <p className="mt-3 text-center text-[16px] leading-snug text-ink-muted">{passo.texto[1]}</p>
        </motion.div>
        <Seta d={2} />
        <motion.div {...sobe(2.2)} className="rounded-2xl border bg-paper-card p-8" style={{ borderColor: ex ? `${COR_NIVEL[ex.nivel]}55` : undefined }}>
          <p className="font-display text-[14px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Sai</p>
          {ex && (
            <>
              <div className="mt-5 flex items-center gap-4">
                <SeloNivel nivel={ex.nivel} tamanho="lg" />
                <span className="font-display text-[34px] font-bold tracking-[-0.04em]">{nomeBairro(ex.nome)}</span>
              </div>
              <p className="mt-4 text-[20px] leading-snug" style={{ color: TEXTO_NIVEL[ex.nivel] }}>
                {textoBr(ex.alerta.motivo)}
              </p>
              <ul className="mt-5 space-y-2.5">
                {ex.alerta.medidas.slice(0, 2).map((m) => (
                  <li key={m} className="flex gap-3 text-[18px] leading-snug text-ink-soft">
                    <Check size={20} className="mt-0.5 shrink-0" style={{ color: TEXTO_NIVEL[ex.nivel] }} aria-hidden />
                    {m}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-5 border-t border-rule pt-4 text-[16px] text-ink-muted">{passo.texto[2]}</p>
        </motion.div>
      </div>
    </Quadro>
  );
}

function Seta({ d }: { d: number }) {
  return (
    <motion.svg {...sobe(d)} viewBox="0 0 60 24" className="w-14 self-center text-rule-strong" aria-hidden>
      <path d="M2 12h52M44 3l10 9-10 9" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
    </motion.svg>
  );
}

export function SlideEngenharia({ passo }: { passo: Passo }) {
  const etapas = [
    { I: GitCommitHorizontal, t: "Mudança no código", s: "push no GitHub" },
    { I: TestTube, t: "Testes automatizados", s: "pytest no GitHub Actions" },
    { I: Package, t: "Build do site", s: "React + Vite, na imagem" },
    { I: Boxes, t: "Imagem Docker", s: "pronta para qualquer servidor" },
  ];
  const blocos = [
    { I: TestTube, t: "Testes", d: passo.texto[0] },
    { I: Boxes, t: "Docker", d: passo.texto[1] },
    { I: KeyRound, t: "Segredos e dados", d: passo.texto[2] },
  ];
  return (
    <Quadro passo={passo}>
      <Titulo>Engenharia que sustenta o alerta.</Titulo>
      <div className="relative mt-[7vh]">
        <motion.div className="absolute left-[4%] right-[4%] top-[34px] h-[2px] origin-left bg-ink" initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: 0.5, duration: 2.4, ease: "easeInOut" }} aria-hidden />
        <ol className="relative grid grid-cols-4 gap-6">
          {etapas.map(({ I, t, s }, i) => (
            <motion.li key={t} {...sobe(0.6 + i * 0.6)} className="flex flex-col items-center text-center">
              <span className="flex h-[70px] w-[70px] items-center justify-center rounded-2xl border-2 border-ink bg-paper">
                <I size={30} strokeWidth={1.8} aria-hidden />
              </span>
              <p className="mt-5 font-display text-[24px] font-bold tracking-[-0.03em]">{t}</p>
              <p className="mt-1 text-[18px] text-ink-muted">{s}</p>
              {i > 0 && (
                <span className="mt-3 inline-flex items-center gap-1.5 text-[15px] font-semibold text-baixo-text">
                  <Check size={16} strokeWidth={3} aria-hidden /> ok
                </span>
              )}
            </motion.li>
          ))}
        </ol>
      </div>
      <div className="mt-[8vh] grid grid-cols-3 gap-10 border-t border-rule pt-8">
        {blocos.map(({ I, t, d }, i) => (
          <motion.div key={t} {...sobe(3 + i * 0.3)}>
            <p className="flex items-center gap-2.5 font-display text-[15px] font-semibold uppercase tracking-[0.16em] text-petrol-700">
              <I size={18} aria-hidden /> {t}
            </p>
            <p className="mt-3 text-[clamp(18px,1.3vw,24px)] leading-snug text-ink-soft">{d}</p>
          </motion.div>
        ))}
      </div>
    </Quadro>
  );
}

export function SlideImpacto({ passo }: { passo: Passo }) {
  return (
    <Quadro passo={passo}>
      <Titulo>Quem ganha com o AlertaClima.</Titulo>
      <div className="mt-[7vh] grid grid-cols-12 gap-[3vw]">
        {[
          { I: House, t: "Moradores", d: "Sabem o risco do próprio bairro e o que fazer antes da chuva." },
          { I: Siren, t: "Defesa Civil e prefeitura", d: "Enxergam onde priorizar a ação, com o motivo de cada alerta." },
        ].map(({ I, t, d }, i) => (
          <motion.div key={t} {...sobe(0.5 + i * 0.4)} className="col-span-3 border-t-[3px] border-ink pt-6">
            <I size={34} strokeWidth={1.7} className="text-petrol-600" aria-hidden />
            <p className="mt-5 font-display text-[32px] font-bold leading-tight tracking-[-0.035em]">{t}</p>
            <p className="mt-3 text-[clamp(18px,1.3vw,24px)] leading-snug text-ink-soft">{d}</p>
          </motion.div>
        ))}
        <div className="col-span-6 grid grid-cols-2 gap-[2vw] rounded-[28px] border border-rule bg-paper-card p-10">
          {[
            { n: "11", cor: "#FD9D24", t: "Cidades e comunidades sustentáveis" },
            { n: "13", cor: "#3F7E44", t: "Ação contra a mudança global do clima" },
          ].map((o, i) => (
            <motion.div key={o.n} {...sobe(1.4 + i * 0.4)}>
              <span className="block h-1.5 w-12 rounded-full" style={{ background: o.cor }} aria-hidden />
              <p className="mt-4 font-display text-[16px] font-semibold uppercase tracking-[0.16em] text-ink-muted">ODS</p>
              <p className="numero-display text-[clamp(110px,10vw,180px)]">{o.n}</p>
              <p className="mt-4 text-[clamp(18px,1.3vw,24px)] font-semibold leading-snug text-ink-soft">{o.t}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Quadro>
  );
}

export function SlideFechamento({ passo }: { passo: Passo }) {
  return (
    <Quadro passo={passo} escuro>
      <Isobaras className="pointer-events-none absolute inset-0 h-full w-full" cx={0.78} cy={0.5} linhas={18} cor="#7FA9AF" />
      <div className="max-w-[1250px]">
        <motion.div {...sobe(0.1)}>
          <Marca tamanho={88} cor="#F4F2EC" onda="#083A43" />
        </motion.div>
        <motion.h1 {...sobe(0.3)} className="mt-10 text-[clamp(52px,5.6vw,108px)] font-extrabold leading-[0.96] tracking-[-0.05em] text-paper">
          Informação que chega antes da água.
        </motion.h1>
        <motion.p {...sobe(0.9)} className="mt-8 max-w-[900px] text-[clamp(20px,1.6vw,30px)] leading-snug text-petrol-100">
          {passo.texto[0]}
        </motion.p>
        <motion.div {...sobe(1.5)} className="mt-14 flex items-center gap-8 border-t border-petrol-300/30 pt-8 text-[20px] text-paper/85">
          <span className="font-display text-[26px] font-bold tracking-[-0.03em] text-paper">
            Alerta<span className="text-petrol-100">Clima</span>
          </span>
          <span>FIAP Global Solution 2026/2</span>
          <span className="text-petrol-100/70">·</span>
          <span>CitizenTech</span>
          <span className="text-petrol-100/70">·</span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={20} aria-hidden /> ODS 11 e 13
          </span>
        </motion.div>
      </div>
    </Quadro>
  );
}
