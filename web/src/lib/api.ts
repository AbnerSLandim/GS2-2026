// Cliente da API. Usa a API real em /api; cai no mock SOMENTE com VITE_USE_MOCK=1.
import { mockApi, streamMock } from "./mock";
import type {
  EventoLeituras,
  IndicadoresResposta,
  LoginResultado,
  Me,
  PainelResposta,
  RegioesResposta,
  SensoresResposta,
} from "./types";

export const USA_MOCK = import.meta.env.VITE_USE_MOCK === "1";

export class ApiErro extends Error {
  constructor(
    public status: number,
    mensagem: string,
  ) {
    super(mensagem);
  }
}

async function obter<T>(caminho: string): Promise<T> {
  let r: Response;
  try {
    r = await fetch(caminho, { credentials: "same-origin", headers: { Accept: "application/json" } });
  } catch {
    throw new ApiErro(0, "Não foi possível conectar ao servidor.");
  }
  if (!r.ok) {
    let msg = "Não foi possível carregar os dados.";
    try {
      const corpo = (await r.json()) as { erro?: string };
      if (corpo.erro) msg = corpo.erro;
    } catch {
      /* corpo sem JSON */
    }
    throw new ApiErro(r.status, msg);
  }
  return (await r.json()) as T;
}

export const api = {
  me: (): Promise<Me> => (USA_MOCK ? mockApi.me() : obter<Me>("/api/me")),
  regioes: (): Promise<RegioesResposta> => (USA_MOCK ? mockApi.regioes() : obter("/api/regioes")),
  painel: (): Promise<PainelResposta> => (USA_MOCK ? mockApi.painel() : obter("/api/painel")),
  sensores: (): Promise<SensoresResposta> => (USA_MOCK ? mockApi.sensores() : obter("/api/sensores")),
  indicadores: (): Promise<IndicadoresResposta> =>
    USA_MOCK ? mockApi.indicadores() : obter("/api/indicadores"),

  async login(senha: string): Promise<LoginResultado> {
    if (USA_MOCK) return mockApi.login(senha);
    let r: Response;
    try {
      r = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ senha }),
      });
    } catch {
      return { ok: false, status: 0, erro: "Não foi possível conectar ao servidor." };
    }
    if (r.ok) return { ok: true };
    let corpo: { erro?: string; tentar_em_s?: number } = {};
    try {
      corpo = await r.json();
    } catch {
      /* sem corpo */
    }
    return {
      ok: false,
      status: r.status,
      erro: corpo.erro ?? "Não foi possível entrar.",
      tentar_em_s: corpo.tentar_em_s,
    };
  },

  async logout(): Promise<void> {
    if (USA_MOCK) return mockApi.logout();
    try {
      await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      /* mesmo offline, a navegação sai do painel */
    }
  },
};

export type OrigemStream = "api" | "mock";

/**
 * Assina o streaming de sensores. Com origem "api" usa EventSource em /api/stream
 * (evento nomeado "leituras"); com "mock" (ou VITE_USE_MOCK=1) simula com setInterval.
 * Devolve a função que encerra a assinatura.
 */
export function assinarStream(
  origem: OrigemStream,
  aoReceber: (e: EventoLeituras) => void,
  aoErro?: () => void,
): () => void {
  if (USA_MOCK || origem === "mock") return streamMock(aoReceber);
  const fonte = new EventSource("/api/stream", { withCredentials: true });
  const ouvir = (ev: MessageEvent<string>) => {
    try {
      aoReceber(JSON.parse(ev.data) as EventoLeituras);
    } catch {
      /* evento malformado: ignora */
    }
  };
  fonte.addEventListener("leituras", ouvir as EventListener);
  // Fecha no erro: evita o EventSource reconectar em loop num 401/503.
  fonte.onerror = () => {
    fonte.close();
    aoErro?.();
  };
  return () => {
    fonte.removeEventListener("leituras", ouvir as EventListener);
    fonte.close();
  };
}
