import { ArrowRight, Cpu, Database, Radio, Workflow } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { PaginaPublica } from "../components/Site";
import { Rotulo } from "../components/ui";

type Area = {
  n: string;
  Icone: typeof Cpu;
  area: string;
  titulo: string;
  itens: string[];
  estado: string;
  pronto: boolean;
};

const AREAS: Area[] = [
  {
    n: "01",
    Icone: Radio,
    area: "MVP e IoT",
    titulo: "Sensores de chuva e vento",
    itens: ["Simulador por bairro (iot/)", "Leituras TIPO_DADO = 'SENSOR'", "Streaming ao vivo por SSE"],
    estado: "Sensores simulados, sem hardware real",
    pronto: true,
  },
  {
    n: "02",
    Icone: Database,
    area: "Big Data",
    titulo: "Oracle e cálculo de risco",
    itens: ["Previsão Open-Meteo e ocorrências", "REGIOES, DADOS_CLIMATICOS, OCORRENCIAS, ANALISE_RISCO", "Evolução com LAG(), ranking e previsão"],
    estado: "Módulo de Big Data e visualização — Joy",
    pronto: true,
  },
  {
    n: "03",
    Icone: Cpu,
    area: "IA",
    titulo: "Classificação e texto do alerta",
    itens: ["Hoje: alerta por regras explicáveis", "Pronto para receber o texto gerado por IA", "Mesmo contrato de motivo e medidas"],
    estado: "Em integração pela área de IA",
    pronto: false,
  },
  {
    n: "04",
    Icone: Workflow,
    area: "Produto",
    titulo: "API e site",
    itens: ["FastAPI: rotas públicas e protegidas", "React: cidadão e Defesa Civil", "Mesma regra de risco nas duas telas"],
    estado: "Site e painel em funcionamento",
    pronto: true,
  },
];

function Seta() {
  return (
    <div className="flex items-center justify-center py-2 text-rule-strong lg:py-0" aria-hidden>
      <ArrowRight size={22} className="rotate-90 lg:rotate-0" />
    </div>
  );
}

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="border-t-2 border-ink pt-4">
      <h3 className="text-[18px] font-bold tracking-[-0.02em]">{titulo}</h3>
      <div className="mt-2 text-[15.5px] leading-relaxed text-ink-muted">{children}</div>
    </div>
  );
}

export default function Sobre() {
  return (
    <PaginaPublica>
      <section className="mx-auto max-w-[1320px] px-5 pt-12 md:px-10 md:pt-20">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Rotulo>Arquitetura</Rotulo>
            <h1 className="mt-3 text-[40px] font-extrabold leading-[1] tracking-[-0.045em] md:text-[64px]">Quatro áreas, um alerta.</h1>
          </div>
          <p className="self-end text-[18px] leading-relaxed text-ink-soft lg:col-span-5">
            O dado nasce no sensor, é organizado no Oracle, vira pontuação de risco e chega ao cidadão com o motivo e o que fazer. DevOps sustenta o caminho todo.
          </p>
        </div>
      </section>

      {/* Diagrama */}
      <section className="mx-auto mt-14 max-w-[1320px] px-5 md:px-10" aria-label="Diagrama da arquitetura">
        <div className="rounded-2xl border border-rule bg-paper-card p-5 md:p-8">
          <div className="grid items-stretch lg:grid-cols-[1fr_40px_1fr_40px_1fr_40px_1fr]">
            {AREAS.map((a, i) => (
              <div key={a.n} className="contents">
                {i > 0 && <Seta />}
                <div className={`flex flex-col rounded-xl border p-5 ${a.pronto ? "border-rule bg-paper" : "border-dashed border-rule-strong bg-paper/40"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-petrol-700">
                      {a.n} · {a.area}
                    </span>
                    <a.Icone size={18} className="text-ink-muted" aria-hidden />
                  </div>
                  <h2 className="mt-3 text-[20px] font-bold leading-tight tracking-[-0.025em]">{a.titulo}</h2>
                  <ul className="mt-3 flex-1 space-y-1.5 text-[14.5px] leading-snug text-ink-soft">
                    {a.itens.map((t) => (
                      <li key={t} className="flex gap-2">
                        <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-faint" aria-hidden />
                        {t}
                      </li>
                    ))}
                  </ul>
                  <p className={`mt-4 border-t pt-3 text-[13px] font-medium ${a.pronto ? "border-rule text-ink-muted" : "border-dashed border-rule-strong text-ink-muted"}`}>
                    {a.estado}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {/* faixa DevOps */}
          <div className="mt-5 rounded-xl bg-ink px-5 py-4 text-paper md:flex md:items-center md:gap-8 md:px-6">
            <span className="font-display text-[12px] font-semibold uppercase tracking-[0.16em] text-petrol-100">05 · DevOps</span>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[14.5px] text-paper/85 md:mt-0">
              <li>GitHub Actions a cada mudança</li>
              <li>Testes automatizados (pytest)</li>
              <li>Build da imagem Docker</li>
              <li>Segredos fora do código</li>
            </ul>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] text-ink-muted">
            <span className="flex items-center gap-2"><span className="h-3 w-5 rounded-[3px] border border-rule bg-paper" aria-hidden /> em funcionamento</span>
            <span className="flex items-center gap-2"><span className="h-3 w-5 rounded-[3px] border border-dashed border-rule-strong" aria-hidden /> em integração</span>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 grid max-w-[1320px] gap-10 px-5 md:grid-cols-3 md:px-10">
        <Bloco titulo="Stack">
          React 18, TypeScript, Vite, Tailwind, Leaflet com mapa OpenStreetMap e Recharts no site. FastAPI e Python na API, com a mesma lógica já testada do
          cálculo de risco. Oracle como banco.
        </Bloco>
        <Bloco titulo="Segurança">
          Painel com senha em hash PBKDF2, bloqueio por endereço após cinco erros, cookie de sessão HttpOnly e assinado, cabeçalhos de segurança e falha fechada sem
          senha configurada. Erros do banco nunca chegam ao navegador.
        </Bloco>
        <Bloco titulo="Sobre os dados">
          Sem Oracle configurado, o sistema usa dados simulados, sempre identificados com o selo “Dados simulados”. Os números desta demonstração não são medições
          reais.
        </Bloco>
      </section>

      <section className="mx-auto mt-20 max-w-[1320px] px-5 md:px-10">
        <div className="grid gap-6 border-t border-rule pt-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <Rotulo>Objetivos de Desenvolvimento Sustentável</Rotulo>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 md:col-span-8">
            {[
              { n: "11", cor: "#FD9D24", t: "Cidades e comunidades sustentáveis", d: "Tornar as cidades mais seguras e resilientes, com informação de risco por bairro." },
              { n: "13", cor: "#3F7E44", t: "Ação contra a mudança do clima", d: "Fortalecer a capacidade de adaptação a eventos extremos, avisando antes." },
            ].map((o) => (
              <div key={o.n} className="flex gap-5">
                <span className="numero-display text-[64px]">{o.n}</span>
                <div>
                  <span className="block h-1 w-8 rounded-full" style={{ background: o.cor }} aria-hidden />
                  <h3 className="mt-2 text-[18px] font-bold tracking-[-0.02em]">{o.t}</h3>
                  <p className="mt-1 text-[15px] text-ink-muted">{o.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-12 text-[15px] text-ink-muted">
          Quer ver funcionando? <Link to="/meu-bairro" className="link-seta">Consulte um bairro</Link>
        </p>
      </section>
    </PaginaPublica>
  );
}
