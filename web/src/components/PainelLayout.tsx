import { Activity, AlertTriangle, BarChart3, LayoutGrid, LogOut, Map, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { limparCache } from "../lib/hooks";
import { Logo } from "./Logo";

export const ITENS_PAINEL = [
  { id: "visao_geral", para: "/painel", rotulo: "Visão geral", Icone: LayoutGrid, fim: true },
  { id: "indicadores", para: "/painel/indicadores", rotulo: "Indicadores", Icone: BarChart3 },
  { id: "mapa", para: "/painel/mapa", rotulo: "Mapa de riscos", Icone: Map },
  { id: "alertas", para: "/painel/alertas", rotulo: "Alertas", Icone: AlertTriangle },
  { id: "ao_vivo", para: "/painel/ao-vivo", rotulo: "Sensores ao vivo", Icone: Activity },
] as const;

export type IdTela = (typeof ITENS_PAINEL)[number]["id"];

/** Moldura do painel. `ativo` + `estatico` permitem desenhá-la no modo apresentação sem navegar. */
export function MolduraPainel({
  children,
  ativo,
  estatico = false,
  aoSair,
}: {
  children: ReactNode;
  ativo?: IdTela;
  estatico?: boolean;
  aoSair?: () => void;
}) {
  const classeItem = (on: boolean) =>
    `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] font-medium transition-colors ${
      on ? "bg-paper-card text-ink shadow-[inset_0_0_0_1px_#DCD8CD]" : "text-ink-muted hover:text-ink"
    }`;

  return (
    <div className="min-h-screen bg-paper lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 z-30 border-b border-rule bg-paper-deep/60 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex h-14 items-center justify-between px-5 lg:h-auto lg:flex-col lg:items-stretch lg:px-4 lg:pt-6">
          <div className="lg:px-2">
            <Logo para={estatico ? "/" : "/painel"} />
            <p className="mt-1.5 hidden pl-[38px] text-[12px] font-medium uppercase tracking-[0.14em] text-ink-faint lg:block">Defesa Civil</p>
          </div>
          {!estatico && (
            <button onClick={aoSair} className="botao-linha lg:hidden" aria-label="Sair do painel">
              <LogOut size={14} aria-hidden /> Sair
            </button>
          )}
        </div>
        <nav className="rolagem-fina flex gap-1 overflow-x-auto px-3 pb-3 lg:mt-8 lg:flex-col lg:overflow-visible lg:px-3" aria-label="Painel">
          {ITENS_PAINEL.map(({ id, para, rotulo, Icone, ...r }) =>
            estatico ? (
              <span key={id} className={`${classeItem(ativo === id)} shrink-0`}>
                <Icone size={17} strokeWidth={2} aria-hidden className={ativo === id ? "text-petrol-600" : ""} />
                {rotulo}
              </span>
            ) : (
              <NavLink key={id} to={para} end={"fim" in r} className={({ isActive }) => `${classeItem(isActive)} shrink-0`}>
                {({ isActive }) => (
                  <>
                    <Icone size={17} strokeWidth={2} aria-hidden className={isActive ? "text-petrol-600" : ""} />
                    {rotulo}
                  </>
                )}
              </NavLink>
            ),
          )}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 hidden space-y-1 border-t border-rule p-3 lg:block">
          {estatico ? (
            <span className={classeItem(false)}>
              <ArrowUpRight size={17} aria-hidden /> Site público
            </span>
          ) : (
            <>
              <Link to="/" className={classeItem(false)}>
                <ArrowUpRight size={17} aria-hidden /> Site público
              </Link>
              <button onClick={aoSair} className={`${classeItem(false)} w-full`}>
                <LogOut size={17} aria-hidden /> Sair
              </button>
            </>
          )}
        </div>
      </aside>
      <main id="conteudo" className="min-w-0">
        {children}
      </main>
    </div>
  );
}

export default function PainelLayout() {
  const navegar = useNavigate();
  const sair = async () => {
    await api.logout();
    limparCache();
    navegar("/entrar", { replace: true });
  };
  return (
    <MolduraPainel aoSair={sair}>
      <Outlet />
    </MolduraPainel>
  );
}

/** Cabeçalho de cada tela do painel: título grande + linha de contexto. */
export function CabecalhoTela({ titulo, sobre, direita }: { titulo: string; sobre?: ReactNode; direita?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-b border-rule pb-6 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-[30px] font-bold leading-tight tracking-[-0.035em] md:text-[38px]">{titulo}</h1>
        {sobre && <p className="mt-1.5 text-[16px] text-ink-muted">{sobre}</p>}
      </div>
      {direita && <div className="flex items-center gap-3">{direita}</div>}
    </div>
  );
}
