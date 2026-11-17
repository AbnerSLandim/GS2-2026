import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { PaginaPublica } from "../components/Site";
import { ICONE_NIVEL, TEXTO_NIVEL } from "../components/nivel";
import { Esqueleto, EstadoErro, Rotulo, SeloFonte } from "../components/ui";
import { api } from "../lib/api";
import { useRecurso } from "../lib/hooks";
import { chave, dataHora, nomeBairro, ROTULO_NIVEL } from "../lib/format";
import type { Regiao } from "../lib/types";
import { BairroView } from "../views/BairroView";

export function SeletorBairro({ regioes, atual, aoEscolher }: { regioes: Regiao[]; atual: Regiao | null; aoEscolher: (nome: string) => void }) {
  const [q, setQ] = useState("");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const campo = useRef<HTMLInputElement>(null);

  // atalho "/" para focar a busca
  useEffect(() => {
    const f = (e: globalThis.KeyboardEvent) => {
      const alvo = e.target as HTMLElement;
      if (e.key === "/" && !["INPUT", "TEXTAREA"].includes(alvo.tagName)) {
        e.preventDefault();
        campo.current?.focus();
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);

  const sugestoes = useMemo(() => {
    const k = chave(q);
    return regioes.filter((r) => !k || chave(nomeBairro(r.nome)).includes(k));
  }, [q, regioes]);

  const escolher = (nome: string) => {
    aoEscolher(nome);
    setQ("");
    setAberto(false);
    campo.current?.blur();
  };

  const teclas = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAberto(true);
      setAtivo((a) => Math.min(a + 1, sugestoes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setAtivo((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && sugestoes[ativo]) {
      e.preventDefault();
      escolher(sugestoes[ativo].nome);
    } else if (e.key === "Escape") setAberto(false);
  };

  return (
    <div>
      <div className="relative max-w-[560px]">
        <div className="flex items-center gap-3 rounded-full border border-rule-strong bg-paper-card px-5 shadow-card focus-within:border-petrol-600">
          <Search size={18} className="text-ink-muted" aria-hidden />
          <input
            ref={campo}
            role="combobox"
            aria-expanded={aberto && sugestoes.length > 0}
            aria-controls="lista-bairros"
            aria-activedescendant={aberto && sugestoes[ativo] ? `op-${chave(sugestoes[ativo].nome)}` : undefined}
            aria-label="Buscar bairro"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setAberto(true);
              setAtivo(0);
            }}
            onFocus={() => setAberto(true)}
            onBlur={() => setTimeout(() => setAberto(false), 120)}
            onKeyDown={teclas}
            placeholder="Buscar bairro"
            className="min-w-0 flex-1 bg-transparent py-3.5 text-[17px] placeholder:text-ink-faint focus:outline-none"
            autoComplete="off"
          />
          <kbd className="hidden rounded border border-rule-strong px-1.5 text-[12px] text-ink-muted sm:block" aria-hidden>
            /
          </kbd>
        </div>
        {aberto && (
          <ul id="lista-bairros" role="listbox" className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-rule bg-paper-card py-1 shadow-lift">
            {sugestoes.length === 0 && <li className="px-5 py-3 text-[15px] text-ink-muted">Nenhum bairro monitorado com esse nome. Por enquanto são {regioes.length} regiões.</li>}
            {sugestoes.map((r, i) => {
              const I = ICONE_NIVEL[r.nivel];
              return (
                <li
                  key={r.nome}
                  id={`op-${chave(r.nome)}`}
                  role="option"
                  aria-selected={i === ativo}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    escolher(r.nome);
                  }}
                  onMouseEnter={() => setAtivo(i)}
                  className={`flex cursor-pointer items-center justify-between px-5 py-2.5 ${i === ativo ? "bg-paper-deep" : ""}`}
                >
                  <span className="font-medium">{nomeBairro(r.nome)}</span>
                  <span className="flex items-center gap-1.5 text-[14px] font-semibold" style={{ color: TEXTO_NIVEL[r.nivel] }}>
                    <I size={14} aria-hidden /> {ROTULO_NIVEL[r.nivel]}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Bairros monitorados">
        {regioes.map((r) => {
          const on = atual?.nome === r.nome;
          return (
            <button
              key={r.nome}
              onClick={() => escolher(r.nome)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[14.5px] font-semibold transition-colors ${
                on ? "border-ink bg-ink text-paper" : "border-rule-strong bg-paper-card text-ink-soft hover:border-ink"
              }`}
            >
              {(() => {
                const I = ICONE_NIVEL[r.nivel];
                return <I size={14} strokeWidth={2.4} style={{ color: on ? "#F4F2EC" : TEXTO_NIVEL[r.nivel] }} aria-hidden />;
              })()}
              {nomeBairro(r.nome)}
              <span className="sr-only">, risco {ROTULO_NIVEL[r.nivel].toLowerCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function useBairroDaUrl(regioes: Regiao[] | undefined) {
  const [params, setParams] = useSearchParams();
  const pedido = params.get("bairro");
  const atual = useMemo(() => {
    if (!regioes?.length) return null;
    if (pedido) return regioes.find((r) => chave(r.nome) === chave(pedido) || chave(nomeBairro(r.nome)) === chave(pedido)) ?? null;
    return regioes[0];
  }, [regioes, pedido]);
  const escolher = (nome: string) => setParams({ bairro: nome }, { replace: true });
  return { atual, pedido, escolher };
}

export default function MeuBairro() {
  const { dados, erro, recarregar } = useRecurso("regioes", api.regioes);
  const { atual, pedido, escolher } = useBairroDaUrl(dados?.regioes);

  return (
    <PaginaPublica>
      <section className="mx-auto max-w-[1320px] px-5 pt-10 md:px-10 md:pt-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <Rotulo>Meu bairro</Rotulo>
            <h1 className="mt-3 text-[38px] font-extrabold leading-[1] tracking-[-0.045em] md:text-[58px]">Qual é o risco onde você mora?</h1>
          </div>
          <div className="lg:col-span-6">{dados && <SeletorBairro regioes={dados.regioes} atual={atual} aoEscolher={escolher} />}</div>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[1320px] px-5 md:px-10">
        {erro && <EstadoErro mensagem={erro.message} aoTentar={recarregar} />}
        {!dados && !erro && (
          <div className="folha grid gap-8 p-10 md:grid-cols-12">
            <div className="space-y-4 md:col-span-7">
              <Esqueleto className="h-7 w-28 rounded-full" />
              <Esqueleto className="h-16 w-80" />
              <Esqueleto className="h-6 w-64" />
              <Esqueleto className="h-20 w-full" />
            </div>
            <div className="md:col-span-5">
              <Esqueleto className="h-40 w-40 rounded-full" />
            </div>
          </div>
        )}
        {dados && pedido && !atual && (
          <div className="folha p-8">
            <p className="font-display text-[20px] font-bold">Não encontramos “{pedido}”.</p>
            <p className="mt-2 text-ink-muted">
              Por enquanto o AlertaClima monitora {dados.regioes.length} regiões de São Paulo: {dados.regioes.map((r) => nomeBairro(r.nome)).join(", ")}. Escolha uma acima.
            </p>
          </div>
        )}
        {atual && <BairroView regiao={atual} />}
        {dados && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[13.5px] text-ink-muted">
            <SeloFonte fonte={dados.fonte} />
            <span>Atualizado em {dataHora(dados.atualizado_em)}. Em caso de dúvida, siga as orientações da Defesa Civil.</span>
          </div>
        )}
      </section>
    </PaginaPublica>
  );
}
