import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { MolduraPainel, CabecalhoTela, type IdTela } from "../components/PainelLayout";
import { Cabecalho } from "../components/Site";
import { SeloFonte } from "../components/ui";
import { api } from "../lib/api";
import { indicadoresMock } from "../lib/mock";
import { indicadoresDe } from "../lib/risco";
import type { IndicadoresResposta, PainelResposta } from "../lib/types";
import { VisaoGeralView } from "../views/VisaoGeralView";
import { AlertasView } from "../views/AlertasView";
import { BairroView } from "../views/BairroView";
import { SeletorBairro } from "./MeuBairro";
import { TelaEntrar } from "./Entrar";
import { SlideEngenharia, SlideFechamento, SlideImpacto, SlideProblema, SlideSolucao } from "./apresentacao/Slides";
import { chave } from "../lib/format";

const MapaView = lazy(() => import("../views/MapaView"));
const AoVivoView = lazy(() => import("../views/AoVivoView"));
const IndicadoresView = lazy(() => import("../views/IndicadoresView"));

type Tela = "slide" | "login" | IdTela | "minha_regiao";

export interface Passo {
  id: string;
  etapa: string;
  titulo: string;
  texto: string[];
  tela: Tela;
  regiao?: string;
  segundos: number;
  /** legenda no canto esquerdo (para não cobrir atribuição do mapa ou dados recentes) */
  esquerda?: boolean;
}

// Mesma ordem e textos do roteiro do pitch (app/apresentacao.py), com a etapa
// "Indicadores" (Big Data) depois da visão geral. Total: 169 s (~2:49).
export const PASSOS: Passo[] = [
  {
    id: "abertura",
    etapa: "O problema",
    titulo: "Chove, alaga e a população descobre tarde demais",
    texto: [
      "Bairros de São Paulo sofrem com enchentes, alagamentos e deslizamentos todo ano.",
      "A previsão do tempo existe, mas não diz se a sua rua corre risco nem o que fazer.",
      "Quem mais sofre são os moradores das regiões que já foram atingidas antes.",
    ],
    tela: "slide",
    segundos: 13,
  },
  {
    id: "solucao",
    etapa: "A solução",
    titulo: "Risco por bairro, com motivo e o que fazer",
    texto: [
      "Cruza previsão de chuva e vento com o histórico de ocorrências de cada bairro.",
      "Classifica o risco de baixo a crítico e explica por quê.",
      "Entrega medidas preventivas claras para o cidadão se preparar antes.",
    ],
    tela: "slide",
    segundos: 14,
  },
  {
    id: "seguranca",
    etapa: "Demonstração · acesso",
    titulo: "Acesso protegido",
    texto: ["O painel só abre com senha, guardada como hash PBKDF2. Cinco tentativas erradas bloqueiam por 30 segundos."],
    tela: "login",
    segundos: 10,
  },
  {
    id: "visao_geral",
    etapa: "Demonstração · 1 de 6",
    titulo: "Visão geral: a cidade em um olhar",
    texto: ["Quantas regiões estão em alerta e onde a chuva e o vento são maiores, com o ranking de risco de cada bairro."],
    tela: "visao_geral",
    segundos: 12,
  },
  {
    id: "indicadores",
    etapa: "Demonstração · 2 de 6 · Big Data",
    titulo: "Indicadores: tendência e previsão",
    texto: ["Evolução do risco em 7 dias, previsão hora a hora e ocorrências por gravidade. Módulo de Big Data e visualização — Joy."],
    tela: "indicadores",
    segundos: 12,
  },
  {
    id: "mapa",
    etapa: "Demonstração · 3 de 6",
    titulo: "Mapa de riscos",
    texto: ["Cada círculo é um bairro: a cor mostra o nível e o tamanho, a pontuação. Em segundos se vê onde agir primeiro."],
    tela: "mapa",
    segundos: 13,
    esquerda: true,
  },
  {
    id: "alertas",
    etapa: "Demonstração · 4 de 6",
    titulo: "Alertas que explicam",
    texto: ["Do mais grave ao menos grave, cada alerta diz o motivo e traz as medidas certas para aquele nível de risco."],
    tela: "alertas",
    segundos: 13,
  },
  {
    id: "regiao_critica",
    etapa: "Demonstração · 5 de 6 · fluxo do cidadão",
    titulo: "Meu bairro: o cidadão escolhe onde mora",
    texto: ["Butantã: risco crítico. A orientação é direta, com os telefones da Defesa Civil e dos Bombeiros."],
    tela: "minha_regiao",
    regiao: "Butanta",
    segundos: 14,
  },
  {
    id: "regiao_baixa",
    etapa: "Demonstração · 5 de 6 · fluxo do cidadão",
    titulo: "Mesma pergunta, outra região",
    texto: ["Centro: risco baixo. O sistema não alarma à toa."],
    tela: "minha_regiao",
    regiao: "Centro",
    segundos: 9,
  },
  {
    id: "ao_vivo",
    etapa: "Demonstração · 6 de 6 · IoT ao vivo",
    titulo: "Sensores enviando dados em tempo real",
    texto: ["Cada bairro envia leituras de chuva e vento e o risco é recalculado a cada uma. Uma frente de chuva chega e os alertas mudam na hora (dados simulados)."],
    tela: "ao_vivo",
    segundos: 25,
    esquerda: true,
  },
  {
    id: "devops",
    etapa: "Por trás do produto",
    titulo: "Engenharia que sustenta o alerta",
    texto: [
      "Cada mudança no código roda os testes automatizados no GitHub Actions.",
      "A aplicação é empacotada em Docker, pronta para rodar em qualquer servidor.",
      "Segredos fora do código e dados organizados em Oracle.",
    ],
    tela: "slide",
    segundos: 12,
  },
  {
    id: "impacto",
    etapa: "Impacto",
    titulo: "Quem ganha com o AlertaClima",
    texto: [
      "Moradores: sabem o risco do próprio bairro e o que fazer antes da chuva.",
      "Defesa Civil e prefeitura: enxergam onde priorizar a ação.",
      "ODS 11 (cidades sustentáveis) e ODS 13 (ação contra a mudança do clima).",
    ],
    tela: "slide",
    segundos: 12,
  },
  {
    id: "fechamento",
    etapa: "Fechamento",
    titulo: "Informação que chega antes da água",
    texto: ["Não basta prever a chuva: o AlertaClima diz quem está em risco, por quê e o que fazer."],
    tela: "slide",
    segundos: 10,
  },
];

export const DURACAO_TOTAL = PASSOS.reduce((s, p) => s + p.segundos, 0);
const INICIO_DE = PASSOS.map((_, i) => PASSOS.slice(0, i).reduce((s, p) => s + p.segundos, 0));

interface Dados {
  painel: PainelResposta;
  indicadores: IndicadoresResposta;
  autenticado: boolean;
}

/** Carrega os dados uma vez. Sem sessão, usa /api/regioes (público) para não travar a gravação. */
function useDadosTour() {
  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState(false);
  useEffect(() => {
    let vivo = true;
    (async () => {
      let autenticado = false;
      try {
        autenticado = (await api.me()).autenticado;
      } catch {
        /* segue como público */
      }
      try {
        let painel: PainelResposta;
        let indicadores: IndicadoresResposta;
        if (autenticado) {
          painel = await api.painel();
          indicadores = await api.indicadores().catch(() => indicadoresMock());
        } else {
          const r = await api.regioes();
          painel = { ...r, indicadores: indicadoresDe(r.regioes) };
          indicadores = indicadoresMock();
        }
        if (vivo) setDados({ painel, indicadores, autenticado });
      } catch {
        if (vivo) setErro(true);
      }
    })();
    return () => {
      vivo = false;
    };
  }, []);
  return { dados, erro };
}

/** Pan vertical lento durante a etapa, para mostrar telas maiores que a altura do vídeo. */
function Pan({ segundos, children, ativo = true }: { segundos: number; children: ReactNode; ativo?: boolean }) {
  const fora = useRef<HTMLDivElement>(null);
  const dentro = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  useLayoutEffect(() => {
    if (!ativo) return;
    const reduz = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let ctrl: ReturnType<typeof animate> | null = null;
    const t = window.setTimeout(() => {
      const distancia = Math.max(0, (dentro.current?.scrollHeight ?? 0) - (fora.current?.clientHeight ?? 0));
      if (!distancia || reduz) return;
      ctrl = animate(y, -distancia, { duration: Math.max(2, segundos * 0.62), ease: [0.45, 0, 0.35, 1] });
    }, segundos * 260);
    return () => {
      window.clearTimeout(t);
      ctrl?.stop();
    };
  }, [segundos, ativo, y]);
  return (
    <div ref={fora} className="h-screen overflow-hidden">
      <motion.div ref={dentro} style={{ y }}>
        {children}
      </motion.div>
    </div>
  );
}

function Legenda({ passo }: { passo: Passo }) {
  return (
    <motion.div
      key={passo.id}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.5, delay: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
      className={`pointer-events-none fixed bottom-10 z-[1000] w-[600px] ${passo.esquerda ? "left-[288px]" : "right-10"} max-w-[calc(100vw-40px)] overflow-hidden rounded-2xl bg-ink text-paper shadow-[0_24px_60px_-20px_rgba(20,23,28,0.55)]`}
      role="status"
      aria-live="polite"
    >
      <div className="flex">
        <span className="w-1.5 shrink-0 bg-petrol-300" aria-hidden />
        <div className="px-7 py-6">
          <p className="font-display text-[12px] font-semibold uppercase tracking-[0.18em] text-petrol-100">{passo.etapa}</p>
          <p className="mt-2 font-display text-[26px] font-bold leading-[1.15] tracking-[-0.03em]">{passo.titulo}</p>
          {passo.texto.map((t) => (
            <p key={t} className="mt-2 text-[17px] leading-snug text-paper/80">
              {t}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function ConteudoPasso({ passo, dados }: { passo: Passo; dados: Dados }) {
  const { painel, indicadores } = dados;
  const fonte = painel.fonte;
  const regiao = passo.regiao ? painel.regioes.find((r) => chave(r.nome) === chave(passo.regiao!)) : undefined;

  const corpoPainel = (titulo: string, sobre: string, filho: ReactNode, f = fonte) => (
    <div className="mx-auto max-w-[1520px] px-10 py-10 pb-[260px]">
      <CabecalhoTela titulo={titulo} sobre={sobre} direita={<SeloFonte fonte={f} />} />
      <div className="mt-8">{filho}</div>
    </div>
  );

  switch (passo.tela) {
    case "slide":
      return passo.id === "abertura" ? (
        <SlideProblema passo={passo} />
      ) : passo.id === "solucao" ? (
        <SlideSolucao passo={passo} regioes={painel.regioes} />
      ) : passo.id === "devops" ? (
        <SlideEngenharia passo={passo} />
      ) : passo.id === "impacto" ? (
        <SlideImpacto passo={passo} />
      ) : (
        <SlideFechamento passo={passo} />
      );
    case "login":
      return <TelaEntrar ilustrativo />;
    case "visao_geral":
      return (
        <MolduraPainel estatico ativo="visao_geral">
          <Pan segundos={passo.segundos}>
            {corpoPainel("Visão geral", "A cidade em um olhar: onde o risco está e por quê.", <VisaoGeralView indicadores={painel.indicadores} regioes={painel.regioes} />)}
          </Pan>
        </MolduraPainel>
      );
    case "indicadores":
      return (
        <MolduraPainel estatico ativo="indicadores">
          <Pan segundos={passo.segundos}>
            {corpoPainel(
              "Indicadores",
              "Módulo de Big Data e visualização — Joy. Ranking, tendência, previsão e ocorrências.",
              <Suspense fallback={<div className="esqueleto h-[600px] rounded-2xl" />}>
                <IndicadoresView dados={indicadores} compacto />
              </Suspense>,
              indicadores.fonte,
            )}
          </Pan>
        </MolduraPainel>
      );
    case "mapa":
      return (
        <MolduraPainel estatico ativo="mapa">
          <div className="mx-auto max-w-[1520px] px-10 py-10">
            <CabecalhoTela titulo="Mapa de riscos" sobre="Cada círculo é uma região: a cor mostra o nível e o tamanho, a pontuação." direita={<SeloFonte fonte={fonte} />} />
            <div className="mt-8">
              <Suspense fallback={<div className="esqueleto h-[760px] rounded-2xl" />}>
                <MapaView regioes={painel.regioes} altura="calc(100vh - 230px)" controles={false} />
              </Suspense>
            </div>
          </div>
        </MolduraPainel>
      );
    case "alertas":
      return (
        <MolduraPainel estatico ativo="alertas">
          <Pan segundos={passo.segundos}>
            {corpoPainel("Alertas", "Do mais grave ao menos grave, cada alerta diz o motivo e o que fazer.", <AlertasView regioes={painel.regioes} atualizadoEm={painel.atualizado_em} />)}
          </Pan>
        </MolduraPainel>
      );
    case "ao_vivo":
      return (
        <MolduraPainel estatico ativo="ao_vivo">
          <div className="mx-auto max-w-[1520px] px-10 py-10">
            <CabecalhoTela titulo="Sensores ao vivo" sobre="Leituras chegando em tempo real e o risco recalculado a cada uma." direita={<SeloFonte fonte="SIMULADO" />} />
            <div className="mt-8">
              <Suspense fallback={<div className="esqueleto h-[600px] rounded-2xl" />}>
                <AoVivoView origem={dados.autenticado ? "api" : "mock"} compacto />
              </Suspense>
            </div>
          </div>
        </MolduraPainel>
      );
    case "minha_regiao":
      return (
        <div className="min-h-screen">
          <Cabecalho />
          <Pan segundos={passo.segundos}>
            <div className="mx-auto max-w-[1320px] px-10 pb-[300px] pt-12">
              <div className="grid grid-cols-12 items-end gap-8">
                <div className="col-span-6">
                  <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Meu bairro</p>
                  <h1 className="mt-3 text-[54px] font-extrabold leading-[1] tracking-[-0.045em]">Qual é o risco onde você mora?</h1>
                </div>
                <div className="col-span-6">
                  <SeletorBairro regioes={painel.regioes} atual={regiao ?? null} aoEscolher={() => undefined} />
                </div>
              </div>
              <div className="mt-10">{regiao && <BairroView regiao={regiao} />}</div>
              <div className="mt-4">
                <SeloFonte fonte={fonte} />
              </div>
            </div>
          </Pan>
        </div>
      );
    default:
      return null;
  }
}

export default function Apresentacao({ modo }: { modo: "auto" | "manual" }) {
  const [params, setParams] = useSearchParams();
  const inicial = Math.min(PASSOS.length - 1, Math.max(0, (parseInt(params.get("passo") ?? "1", 10) || 1) - 1));
  const [indice, setIndice] = useState(inicial);
  const { dados, erro } = useDadosTour();
  const passo = PASSOS[indice];
  const progresso = useMotionValue(INICIO_DE[inicial] / DURACAO_TOTAL);

  useEffect(() => {
    document.title = "Apresentação · AlertaClima";
    if (modo !== "auto") return;
    document.documentElement.classList.add("modo-apresentacao");
    return () => document.documentElement.classList.remove("modo-apresentacao");
  }, [modo]);

  // avanço automático: um relógio por etapa
  useEffect(() => {
    if (!dados) return;
    const de = INICIO_DE[indice] / DURACAO_TOTAL;
    const ate = (INICIO_DE[indice] + passo.segundos) / DURACAO_TOTAL;
    progresso.set(de);
    if (modo !== "auto") {
      progresso.set(ate);
      return;
    }
    const ctrl = animate(progresso, ate, { duration: passo.segundos, ease: "linear" });
    const t = indice < PASSOS.length - 1 ? window.setTimeout(() => setIndice((i) => i + 1), passo.segundos * 1000) : 0;
    return () => {
      ctrl.stop();
      window.clearTimeout(t);
    };
  }, [indice, dados, modo, passo.segundos, progresso]);

  // setas do teclado no modo manual
  useEffect(() => {
    if (modo !== "manual") return;
    const f = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        setIndice((i) => Math.min(PASSOS.length - 1, i + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIndice((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [modo]);

  useEffect(() => {
    if (modo !== "manual") return;
    const p = new URLSearchParams(params);
    p.set("passo", String(indice + 1));
    setParams(p, { replace: true });
  }, [indice]); // eslint-disable-line react-hooks/exhaustive-deps

  const largura = useMemo(() => progresso, [progresso]);

  if (erro)
    return (
      <div className="flex min-h-screen items-center justify-center p-10 text-center">
        <div>
          <p className="font-display text-[24px] font-bold">Não foi possível carregar os dados da apresentação.</p>
          <p className="mt-2 text-ink-muted">Verifique se a API está no ar em /api e recarregue a página.</p>
        </div>
      </div>
    );

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper">
      {/* barra de progresso fina */}
      <div className="fixed inset-x-0 top-0 z-[1100] h-[3px] bg-ink/5" aria-hidden>
        <motion.div className="h-full origin-left bg-petrol-600" style={{ scaleX: largura }} />
        {INICIO_DE.slice(1).map((s) => (
          <span key={s} className="absolute top-0 h-full w-[2px] bg-paper" style={{ left: `${(s / DURACAO_TOTAL) * 100}%` }} />
        ))}
      </div>

      {!dados ? (
        <div className="flex min-h-screen items-center justify-center text-ink-muted">Preparando a apresentação…</div>
      ) : (
        <>
          <AnimatePresence mode="wait">
            <motion.div
              key={passo.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: "easeInOut" }}
            >
              <ConteudoPasso passo={passo} dados={dados} />
            </motion.div>
          </AnimatePresence>
          <AnimatePresence mode="wait">{passo.tela !== "slide" && <Legenda key={passo.id} passo={passo} />}</AnimatePresence>
          {modo === "manual" && (
            <p className="fixed bottom-3 left-1/2 z-[1100] -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1 text-[12px] tabular-nums text-paper/90">
              {indice + 1} / {PASSOS.length} · use ← →
            </p>
          )}
        </>
      )}
    </div>
  );
}
