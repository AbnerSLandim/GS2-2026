// Dados SIMULADOS no formato exato do contrato (docs/PLANO_FRONT_REACT.md).
// Usados só com VITE_USE_MOCK=1 (desenvolvimento) e no streaming do modo
// apresentação sem sessão. Os valores do painel são os mesmos que o modo
// simulado da API gera (app/dados.py): Butanta CRÍTICO 77,5; Centro BAIXO 24.
import type {
  EventoLeituras,
  IndicadoresResposta,
  Leitura,
  LoginResultado,
  Me,
  Nivel,
  PainelResposta,
  Regiao,
  RegioesResposta,
  RiscoAoVivo,
  SensoresResposta,
} from "./types";
import {
  MEDIDAS,
  indicadoresDe,
  motivo,
  nivelPorPontuacao,
  ordenar,
  pontosHistoricos,
  pontuar,
} from "./risco";

export const REGIOES_DEMO: Record<string, [number, number]> = {
  Centro: [-23.5505, -46.6333],
  Mooca: [-23.55, -46.6],
  Ipiranga: [-23.585, -46.61],
  "Vila Mariana": [-23.589, -46.634],
  Butanta: [-23.57, -46.72],
};

export const OCORRENCIAS_DEMO: Record<string, string[]> = {
  Centro: ["MEDIA", "ALTA"],
  Mooca: ["ALTA", "ALTA", "CRITICA"],
  Ipiranga: ["ALTA", "CRITICA", "CRITICA"],
  "Vila Mariana": ["BAIXA", "MEDIA"],
  Butanta: ["CRITICA", "CRITICA", "ALTA", "ALTA"],
};

/** (chuva base mm/h, vento base km/h) — iot/simulador_sensores.py PERFIS */
export const PERFIS: Record<string, [number, number]> = {
  Centro: [0.2, 18.0],
  Mooca: [0.4, 22.0],
  Ipiranga: [0.6, 26.0],
  "Vila Mariana": [0.3, 20.0],
  Butanta: [1.2, 34.0],
};

// Clima previsto nas próximas 24 h (o mesmo resultado do modo simulado da API).
const CLIMA_24H: Record<string, [number, number]> = {
  Centro: [4.4, 23.3],
  Mooca: [9.9, 29.5],
  Ipiranga: [15.0, 34.3],
  "Vila Mariana": [7.2, 26.5],
  Butanta: [28.1, 50.0],
};

// ---------- aleatório com semente (determinístico) ----------
function rng(seed: number) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = (media: number, desvio: number) => {
    const u = 1 - next();
    const v = next();
    return media + desvio * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { next, gauss };
}

const iso = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
};
const agoraIso = () => iso(new Date(new Date().setMilliseconds(0)));
const espera = (ms: number) => new Promise((r) => setTimeout(r, ms));

function montarRegiao(nome: string): Regiao {
  const [lat, lon] = REGIOES_DEMO[nome];
  const [chuva, vento] = CLIMA_24H[nome];
  const ocorr = OCORRENCIAS_DEMO[nome].length;
  const p = pontuar(chuva, vento, pontosHistoricos(OCORRENCIAS_DEMO[nome]));
  const nivel = nivelPorPontuacao(p);
  return {
    nome,
    lat,
    lon,
    nivel,
    pontuacao: p,
    chuva_mm: chuva,
    vento_kmh: vento,
    ocorrencias: ocorr,
    data_analise: null,
    alerta: { motivo: motivo(chuva, vento, ocorr, nivel), medidas: [...MEDIDAS[nivel]] },
  };
}

export function regioesMock(): Regiao[] {
  return ordenar(Object.keys(REGIOES_DEMO).map(montarRegiao));
}

// ---------- sessão simulada ----------
const CHAVE_SESSAO = "alertaclima.mock.sessao";
const SENHA_DEMO = "demo";
let erros = 0;
let bloqueadoAte = 0;

function lerSessao(): boolean {
  try {
    return sessionStorage.getItem(CHAVE_SESSAO) === "1";
  } catch {
    return memoriaSessao;
  }
}
let memoriaSessao = false;
function gravarSessao(v: boolean) {
  memoriaSessao = v;
  try {
    if (v) sessionStorage.setItem(CHAVE_SESSAO, "1");
    else sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    /* sem storage: fica em memória */
  }
}

export const mockApi = {
  senhaDemo: SENHA_DEMO,
  async me(): Promise<Me> {
    await espera(120);
    // atalho só do mock (prints automatizados): ?mock_sessao=1 já entra logado
    if (new URLSearchParams(window.location.search).get("mock_sessao") === "1") gravarSessao(true);
    return { autenticado: lerSessao(), auth_configurada: true };
  },
  async regioes(): Promise<RegioesResposta> {
    await espera(250);
    return { fonte: "SIMULADO", atualizado_em: agoraIso(), regioes: regioesMock() };
  },
  async painel(): Promise<PainelResposta> {
    await espera(300);
    const regioes = regioesMock();
    return { fonte: "SIMULADO", atualizado_em: agoraIso(), indicadores: indicadoresDe(regioes), regioes };
  },
  async sensores(): Promise<SensoresResposta> {
    await espera(200);
    const r = rng(2026);
    const fim = new Date();
    fim.setMinutes(0, 0, 0);
    const leituras: Leitura[] = [];
    for (const [nome, [c, v]] of Object.entries(PERFIS)) {
      for (let i = 0; i < 24; i++) {
        const d = new Date(fim.getTime() - (23 - i) * 3600_000);
        leituras.push({
          data: iso(d),
          regiao: nome,
          chuva_mm: +Math.max(0, r.gauss(c, c * 0.4)).toFixed(2),
          vento_kmh: +Math.max(0, r.gauss(v, v * 0.25)).toFixed(1),
        });
      }
    }
    return { fonte: "SIMULADO", leituras };
  },
  async indicadores(): Promise<IndicadoresResposta> {
    await espera(300);
    return indicadoresMock();
  },
  /** Senha "demo" entra; "503" simula acesso não configurado. 5 erros bloqueiam por 30 s. */
  async login(senha: string): Promise<LoginResultado> {
    await espera(450);
    if (senha === "503") return { ok: false, status: 503, erro: "Acesso não configurado." };
    const agora = Date.now();
    if (bloqueadoAte > agora)
      return {
        ok: false,
        status: 429,
        erro: "Muitas tentativas. Tente novamente em instantes.",
        tentar_em_s: Math.ceil((bloqueadoAte - agora) / 1000),
      };
    if (senha !== SENHA_DEMO) {
      erros += 1;
      if (erros >= 5) {
        erros = 0;
        bloqueadoAte = agora + 30_000;
      }
      return { ok: false, status: 401, erro: "Senha incorreta." };
    }
    erros = 0;
    gravarSessao(true);
    return { ok: true };
  },
  async logout(): Promise<void> {
    await espera(100);
    gravarSessao(false);
  },
};

// ---------- Indicadores (Big Data) ----------
export function indicadoresMock(): IndicadoresResposta {
  const regioes = regioesMock();
  const r = rng(11);
  const hoje = new Date();
  hoje.setHours(6, 0, 0, 0);

  const evolucao: IndicadoresResposta["evolucao"] = [];
  for (const reg of regioes) {
    // caminhada para trás a partir da pontuação atual (7 análises, uma por dia)
    const serie: number[] = [reg.pontuacao];
    for (let i = 1; i < 7; i++) {
      const anterior = serie[0] - r.gauss(reg.nivel === "CRITICO" ? 5 : 1.5, 4.5);
      serie.unshift(Math.round(Math.min(95, Math.max(4, anterior)) * 2) / 2);
    }
    serie.forEach((p, i) => {
      const d = new Date(hoje.getTime() - (6 - i) * 86400_000);
      const ant = i === 0 ? null : serie[i - 1];
      const variacao = ant === null ? null : Math.round((p - ant) * 10) / 10;
      evolucao.push({
        data: iso(d),
        regiao: reg.nome,
        pontuacao: p,
        variacao,
        tendencia:
          ant === null
            ? "PRIMEIRA ANALISE"
            : p > ant
              ? "RISCO AUMENTOU"
              : p < ant
                ? "RISCO DIMINUIU"
                : "RISCO ESTAVEL",
      });
    });
  }

  const previsao: IndicadoresResposta["previsao"] = [];
  const inicio = new Date();
  inicio.setMinutes(0, 0, 0);
  for (const reg of regioes) {
    const total = CLIMA_24H[reg.nome][0];
    for (let h = 0; h < 48; h++) {
      const d = new Date(inicio.getTime() + h * 3600_000);
      const hr = d.getHours();
      // pico de chuva no fim da tarde, como uma frente que chega
      const pico = Math.exp(-(((h % 24) - 17) ** 2) / 18);
      const chuva = Math.max(0, (total / 7.5) * pico * (h < 24 ? 1 : 0.55) + r.gauss(0, 0.08));
      const temp = 19.5 + 5.5 * Math.sin(((hr - 9) / 24) * 2 * Math.PI) + r.gauss(0, 0.4) - chuva * 0.6;
      previsao.push({
        data: iso(d),
        regiao: reg.nome,
        chuva_mm: +chuva.toFixed(2),
        temperatura: +temp.toFixed(1),
        umidade: +Math.min(99, 68 + chuva * 9 + r.gauss(0, 3)).toFixed(0),
        vento_kmh: +Math.max(4, CLIMA_24H[reg.nome][1] * (0.45 + 0.55 * pico) + r.gauss(0, 2)).toFixed(1),
      });
    }
  }

  const ocorrencias: IndicadoresResposta["ocorrencias"] = [];
  for (const [nome, lista] of Object.entries(OCORRENCIAS_DEMO)) {
    const cont: Record<string, number> = {};
    lista.forEach((g) => (cont[g] = (cont[g] ?? 0) + 1));
    Object.entries(cont).forEach(([gravidade, total]) => ocorrencias.push({ regiao: nome, gravidade, total }));
  }

  return {
    fonte: "SIMULADO",
    ranking: regioes.map((x) => ({ nome: x.nome, pontuacao: x.pontuacao, nivel: x.nivel })),
    evolucao,
    previsao,
    ocorrencias,
  };
}

// ---------- streaming simulado (mesma lógica de app/ao_vivo.py) ----------
interface Bruta {
  momento: Date;
  regiao: string;
  chuva: number;
  vento: number;
}

function novaLeitura(regiao: string, momento: Date, tick: number, a: ReturnType<typeof rng>): Bruta {
  const [cb, vb] = PERFIS[regiao];
  const frente = 1 + 0.06 * tick;
  return {
    momento,
    regiao,
    chuva: +Math.max(0, a.gauss(cb * frente, cb * 0.35)).toFixed(2),
    vento: +Math.max(0, a.gauss(vb * (1 + 0.02 * tick), vb * 0.2)).toFixed(1),
  };
}

function riscoPorRegiao(leituras: Bruta[]): RiscoAoVivo[] {
  const linhas: RiscoAoVivo[] = Object.keys(PERFIS).map((nome) => {
    const janela = leituras.filter((l) => l.regiao === nome).slice(-24);
    const chuva = janela.reduce((s, l) => s + l.chuva, 0);
    const vento = Math.max(0, ...janela.map((l) => l.vento));
    const p = pontuar(chuva, vento, pontosHistoricos(OCORRENCIAS_DEMO[nome] ?? []));
    return {
      nome,
      nivel: nivelPorPontuacao(p) as Nivel,
      pontuacao: Math.round(p * 10) / 10,
      chuva_24h_mm: Math.round(chuva * 10) / 10,
      vento_max_kmh: Math.round(vento),
    };
  });
  return linhas.sort((a, b) => b.pontuacao - a.pontuacao);
}

/** Simula o /api/stream com setInterval. Devolve a função que encerra. */
export function streamMock(aoReceber: (e: EventoLeituras) => void, intervaloMs = 800): () => void {
  const a = rng(7);
  const agora = new Date();
  agora.setSeconds(0, 0);
  let leituras: Bruta[] = [];
  for (let h = 12; h > 0; h--)
    for (const reg of Object.keys(PERFIS)) leituras.push(novaLeitura(reg, new Date(agora.getTime() - h * 3600_000), 0, a));
  let total = leituras.length;
  let tick = 0;

  const id = window.setInterval(() => {
    tick += 1;
    const momento = new Date(agora.getTime() + tick * 3600_000);
    const novas = Object.keys(PERFIS).map((r) => novaLeitura(r, momento, tick, a));
    leituras = [...leituras, ...novas].slice(-48 * 5);
    total += novas.length;
    aoReceber({
      tick,
      momento: iso(momento),
      total,
      novas: novas.map((n) => ({ data: iso(n.momento), regiao: n.regiao, chuva_mm: n.chuva, vento_kmh: n.vento })),
      risco: riscoPorRegiao(leituras),
    });
  }, intervaloMs);
  return () => window.clearInterval(id);
}
