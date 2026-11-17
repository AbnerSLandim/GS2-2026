import { Lock, Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Logo } from "./Logo";

const LINKS = [
  { para: "/meu-bairro", rotulo: "Meu bairro" },
  { para: "/#como-funciona", rotulo: "Como funciona" },
  { para: "/sobre", rotulo: "Arquitetura" },
];

export function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  return (
    <header className="relative z-20 border-b border-rule/80 bg-paper/90 backdrop-blur-[2px]">
      <div className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:px-10">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {LINKS.map((l) => (
            <NavLink
              key={l.para}
              to={l.para}
              className={({ isActive }) =>
                `text-[15.5px] font-medium transition-colors hover:text-ink ${isActive && !l.para.includes("#") ? "text-ink" : "text-ink-muted"}`
              }
            >
              {l.rotulo}
            </NavLink>
          ))}
          <Link to="/painel" className="botao-linha">
            <Lock size={13} aria-hidden /> Painel da Defesa Civil
          </Link>
        </nav>
        <button
          className="-mr-2 rounded-md p-2 text-ink md:hidden"
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
          onClick={() => setAberto((v) => !v)}
        >
          {aberto ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {aberto && (
        <nav className="border-t border-rule px-5 pb-4 md:hidden" aria-label="Principal">
          {LINKS.map((l) => (
            <Link key={l.para} to={l.para} onClick={() => setAberto(false)} className="block border-b border-rule py-3 text-[17px] font-medium">
              {l.rotulo}
            </Link>
          ))}
          <Link to="/painel" className="mt-4 inline-flex items-center gap-2 text-[16px] font-semibold text-petrol-700">
            <Lock size={15} aria-hidden /> Painel da Defesa Civil
          </Link>
        </nav>
      )}
    </header>
  );
}

export function Rodape() {
  return (
    <footer className="mt-24 border-t border-ink/80 bg-paper">
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-12 md:grid-cols-12 md:px-10">
        <div className="md:col-span-5">
          <Logo />
          <p className="mt-4 max-w-sm text-[15px] text-ink-muted">
            Risco de enchente, alagamento e deslizamento por bairro de São Paulo, com o motivo e o que fazer.
          </p>
        </div>
        <div className="text-[15px] md:col-span-4">
          <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Projeto</p>
          <p className="mt-3 text-ink-soft">FIAP · Global Solution 2026/2</p>
          <p className="text-ink-soft">Tema CitizenTech · ODS 11 e ODS 13</p>
          <p className="mt-3 text-ink-muted">Os dados exibidos nesta demonstração são simulados.</p>
        </div>
        <div className="text-[15px] md:col-span-3">
          <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Em emergência</p>
          <p className="mt-3 text-ink-soft">
            <span className="font-display font-bold tabular-nums text-ink">199</span> Defesa Civil
          </p>
          <p className="text-ink-soft">
            <span className="font-display font-bold tabular-nums text-ink">193</span> Bombeiros
          </p>
        </div>
      </div>
    </footer>
  );
}

export function PaginaPublica({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded focus:bg-ink focus:px-3 focus:py-2 focus:text-paper">
        Pular para o conteúdo
      </a>
      <Cabecalho />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Rodape />
    </div>
  );
}
