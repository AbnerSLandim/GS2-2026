import { useCallback, useEffect, useRef, useState } from "react";
import { ApiErro } from "./api";

export interface Estado<T> {
  dados: T | null;
  erro: ApiErro | null;
  carregando: boolean;
  recarregar: () => void;
}

// Cache simples por chave: navegar entre telas não pisca skeleton de novo.
const cache = new Map<string, unknown>();

export function useRecurso<T>(chave: string, carregar: () => Promise<T>): Estado<T> {
  const [dados, setDados] = useState<T | null>(() => (cache.get(chave) as T) ?? null);
  const [erro, setErro] = useState<ApiErro | null>(null);
  const [carregando, setCarregando] = useState(!cache.has(chave));
  const [versao, setVersao] = useState(0);
  const fn = useRef(carregar);
  fn.current = carregar;

  useEffect(() => {
    let vivo = true;
    if (!cache.has(chave)) setCarregando(true);
    fn
      .current()
      .then((d) => {
        if (!vivo) return;
        cache.set(chave, d);
        setDados(d);
        setErro(null);
      })
      .catch((e: unknown) => {
        if (!vivo) return;
        setErro(e instanceof ApiErro ? e : new ApiErro(0, "Não foi possível carregar os dados."));
      })
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [chave, versao]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  return { dados, erro, carregando, recarregar };
}

export function limparCache() {
  cache.clear();
}

/** Conta de `de` até `para` (para números animados). Respeita reduced-motion. */
export function useContador(para: number, duracaoMs = 900): number {
  const [valor, setValor] = useState(para);
  const anterior = useRef(0);
  useEffect(() => {
    const reduz = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const de = anterior.current;
    anterior.current = para;
    if (reduz || de === para) {
      setValor(para);
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / duracaoMs);
      const e = 1 - Math.pow(1 - k, 3);
      setValor(de + (para - de) * e);
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [para, duracaoMs]);
  return valor;
}
