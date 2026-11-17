import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import type { Me } from "../lib/types";
import { CarregandoTela } from "./CarregandoTela";

/** Rotas /painel/* exigem sessão (GET /api/me). Sem sessão: /entrar?voltar=... */
export function RequireAuth({ children }: { children: ReactNode }) {
  const local = useLocation();
  const [me, setMe] = useState<Me | null | "erro">(null);

  useEffect(() => {
    let vivo = true;
    api
      .me()
      .then((m) => vivo && setMe(m))
      .catch(() => vivo && setMe("erro"));
    return () => {
      vivo = false;
    };
  }, [local.pathname]);

  if (me === null) return <CarregandoTela />;
  if (me === "erro" || !me.autenticado) {
    const voltar = encodeURIComponent(local.pathname + local.search);
    return <Navigate to={`/entrar?voltar=${voltar}`} replace />;
  }
  return <>{children}</>;
}
