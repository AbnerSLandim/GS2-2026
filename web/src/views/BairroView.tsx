import { motion } from "framer-motion";
import { Check, CloudRain, History, Phone, Wind } from "lucide-react";
import type { Regiao } from "../lib/types";
import { nomeBairro, num, textoBr } from "../lib/format";
import { COR_NIVEL, FUNDO_NIVEL, RESUMO_NIVEL, SeloNivel, TEXTO_NIVEL } from "../components/nivel";
import { EscalaRisco, Medidor } from "../components/ui";

export function BairroView({ regiao: r }: { regiao: Regiao }) {
  const grave = r.nivel === "ALTO" || r.nivel === "CRITICO";
  return (
    <motion.article
      key={r.nome}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
      className="relative overflow-hidden rounded-2xl border bg-paper-card"
      style={{ borderColor: `${COR_NIVEL[r.nivel]}40` }}
      aria-labelledby="titulo-bairro"
    >
      <div className="h-1.5" style={{ background: COR_NIVEL[r.nivel] }} aria-hidden />
      <div className="grid gap-8 p-6 md:grid-cols-12 md:gap-10 md:p-10">
        <div className="md:col-span-7">
          <SeloNivel nivel={r.nivel} tamanho="lg" />
          <h2 id="titulo-bairro" className="mt-4 text-[44px] font-extrabold leading-[0.95] tracking-[-0.045em] md:text-[64px]">
            {nomeBairro(r.nome)}
          </h2>
          <p className="mt-3 font-display text-[21px] font-semibold tracking-[-0.02em] md:text-[24px]" style={{ color: TEXTO_NIVEL[r.nivel] }}>
            {RESUMO_NIVEL[r.nivel]}
          </p>
          <p className="mt-4 max-w-[560px] text-[18px] leading-relaxed text-ink-soft">{textoBr(r.alerta.motivo)}</p>

          <dl className="mt-7 grid max-w-[560px] grid-cols-3 border-y border-rule">
            {[
              { I: CloudRain, rot: "Chuva", v: `${num(r.chuva_mm, 1)}`, u: "mm" },
              { I: Wind, rot: "Vento", v: `${num(r.vento_kmh, 0)}`, u: "km/h" },
              { I: History, rot: "Ocorrências", v: `${r.ocorrencias}`, u: "registros" },
            ].map(({ I, rot, v, u }, i) => (
              <div key={rot} className={`py-4 ${i ? "border-l border-rule pl-4" : ""}`}>
                <dt className="flex items-center gap-1.5 text-[13px] text-ink-muted">
                  <I size={14} aria-hidden /> {rot}
                </dt>
                <dd className="mt-1.5">
                  <span className="numero-display text-[30px] md:text-[34px]">{v}</span>{" "}
                  <span className="text-[13px] text-ink-muted">{u}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="flex flex-col md:col-span-5">
          <div className="flex items-center gap-5 md:gap-6">
            <Medidor pontuacao={r.pontuacao} nivel={r.nivel} tamanho={150} />
            <div className="text-[14px] leading-snug text-ink-muted">
              <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em]">Pontuação de risco</p>
              <p className="mt-1.5">Chuva prevista, vento e o histórico de ocorrências do bairro.</p>
            </div>
          </div>
          <div className="mt-5">
            <EscalaRisco pontuacao={r.pontuacao} />
          </div>

          <div className="mt-8">
            <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">O que fazer agora</p>
            <ul className="mt-3 space-y-2.5">
              {r.alerta.medidas.map((m, i) => (
                <motion.li
                  key={m}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + i * 0.08 }}
                  className="flex gap-3 text-[16.5px] leading-snug text-ink"
                >
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{ background: FUNDO_NIVEL[r.nivel], color: TEXTO_NIVEL[r.nivel], boxShadow: `inset 0 0 0 1px ${COR_NIVEL[r.nivel]}40` }}
                    aria-hidden
                  >
                    <Check size={13} strokeWidth={3} />
                  </span>
                  {m}
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {grave && (
        <div className="grid border-t sm:grid-cols-2" style={{ borderColor: `${COR_NIVEL[r.nivel]}40`, background: FUNDO_NIVEL[r.nivel] }}>
          {[
            { n: "199", rot: "Defesa Civil" },
            { n: "193", rot: "Corpo de Bombeiros" },
          ].map((t, i) => (
            <a
              key={t.n}
              href={`tel:${t.n}`}
              className={`flex items-center gap-4 px-6 py-5 transition-colors hover:bg-white/50 md:px-10 ${i ? "border-t sm:border-l sm:border-t-0" : ""}`}
              style={{ borderColor: `${COR_NIVEL[r.nivel]}40` }}
            >
              <Phone size={20} style={{ color: TEXTO_NIVEL[r.nivel] }} aria-hidden />
              <span className="numero-display text-[40px]" style={{ color: TEXTO_NIVEL[r.nivel] }}>
                {t.n}
              </span>
              <span className="text-[15px] font-semibold leading-tight text-ink">
                {t.rot}
                <span className="block text-[13px] font-normal text-ink-muted">Ligação gratuita, 24 horas</span>
              </span>
            </a>
          ))}
        </div>
      )}
    </motion.article>
  );
}
