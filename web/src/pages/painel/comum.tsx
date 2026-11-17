import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import type { ApiErro } from "../../lib/api";
import { Esqueleto, EstadoErro, SeloFonte } from "../../components/ui";
import { CabecalhoTela } from "../../components/PainelLayout";
import { dataHora } from "../../lib/format";
import type { Fonte } from "../../lib/types";

export function Tela({
  titulo,
  sobre,
  fonte,
  atualizado,
  erro,
  aoTentar,
  carregando,
  extra,
  children,
}: {
  titulo: string;
  sobre: string;
  fonte?: Fonte;
  atualizado?: string;
  erro: ApiErro | null;
  aoTentar: () => void;
  carregando: boolean;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const local = useLocation();
  if (erro?.status === 401) return <Navigate to={`/entrar?voltar=${encodeURIComponent(local.pathname)}`} replace />;
  return (
    <div className="mx-auto max-w-[1520px] px-5 py-8 md:px-10 md:py-10">
      <CabecalhoTela
        titulo={titulo}
        sobre={sobre}
        direita={
          <>
            {extra}
            {atualizado && <span className="hidden text-[13px] text-ink-muted sm:inline">Atualizado {dataHora(atualizado)}</span>}
            <SeloFonte fonte={fonte} />
          </>
        }
      />
      <div className="mt-8">
        {erro ? (
          <EstadoErro mensagem={erro.message} aoTentar={aoTentar} />
        ) : carregando ? (
          <div className="space-y-6">
            <Esqueleto className="h-40 w-full" />
            <Esqueleto className="h-72 w-full" />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
