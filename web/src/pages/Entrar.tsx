import { ArrowLeft, Eye, EyeOff, KeyRound, Lock, ShieldCheck, Timer } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { Isobaras } from "../components/Isobaras";
import { api, USA_MOCK } from "../lib/api";
import { limparCache } from "../lib/hooks";
import { mockApi } from "../lib/mock";

type Erro = { status: number; texto: string } | null;

/** Cartão de login. `ilustrativo` desenha o formulário preenchido e inerte (modo apresentação). */
export function CartaoLogin({ ilustrativo = false }: { ilustrativo?: boolean }) {
  const [senha, setSenha] = useState("");
  const [ver, setVer] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<Erro>(null);
  const [espera, setEspera] = useState(0);
  const [params] = useSearchParams();
  const navegar = useNavigate();

  useEffect(() => {
    if (espera <= 0) return;
    const id = window.setInterval(() => setEspera((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [espera > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (espera === 0 && erro?.status === 429) setErro(null);
  }, [espera, erro]);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (ilustrativo || !senha || espera > 0) return;
    setEnviando(true);
    setErro(null);
    const r = await api.login(senha);
    setEnviando(false);
    if (r.ok) {
      limparCache();
      const voltar = params.get("voltar");
      navegar(voltar && voltar.startsWith("/painel") ? voltar : "/painel", { replace: true });
      return;
    }
    if (r.status === 429) setEspera(r.tentar_em_s ?? 30);
    setErro({
      status: r.status,
      texto:
        r.status === 401
          ? "Senha incorreta. Confira e tente de novo."
          : r.status === 503
            ? "O acesso ao painel ainda não foi configurado neste servidor. Fale com o administrador."
            : r.status === 429
              ? "Muitas tentativas erradas. Por segurança, o acesso foi pausado."
              : r.erro,
    });
    setSenha("");
  };

  const bloqueado = espera > 0;
  return (
    <form onSubmit={enviar} className="w-full max-w-[420px] rounded-2xl border border-rule bg-paper-card p-7 shadow-lift md:p-9" noValidate>
      <div className="flex items-center gap-2 text-ink-muted">
        <Lock size={15} aria-hidden />
        <span className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em]">Acesso restrito</span>
      </div>
      <h1 className="mt-3 text-[30px] font-bold tracking-[-0.035em]">Painel da Defesa Civil</h1>
      <p className="mt-1.5 text-[15.5px] text-ink-muted">Entre com a senha de operador.</p>

      <label htmlFor="senha" className="mt-7 block text-[14px] font-semibold text-ink-soft">
        Senha
      </label>
      <div className="mt-2 flex items-center rounded-xl border border-rule-strong bg-paper focus-within:border-petrol-600 focus-within:ring-2 focus-within:ring-petrol-100">
        <KeyRound size={17} className="ml-4 text-ink-muted" aria-hidden />
        <input
          id="senha"
          type={ver ? "text" : "password"}
          value={ilustrativo ? "alertaclima" : senha}
          onChange={(e) => setSenha(e.target.value)}
          readOnly={ilustrativo}
          tabIndex={ilustrativo ? -1 : undefined}
          autoComplete="current-password"
          autoFocus={!ilustrativo}
          disabled={bloqueado}
          aria-invalid={erro?.status === 401}
          aria-describedby={erro ? "erro-login" : undefined}
          className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[17px] tracking-wide focus:outline-none disabled:opacity-50"
        />
        {!ilustrativo && (
          <button
            type="button"
            onClick={() => setVer((v) => !v)}
            className="mr-2 rounded-md p-2 text-ink-muted hover:text-ink"
            aria-label={ver ? "Ocultar senha" : "Mostrar senha"}
          >
            {ver ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>

      {erro && (
        <div
          id="erro-login"
          role="alert"
          className={`mt-4 rounded-xl border px-4 py-3 text-[14.5px] leading-snug ${
            erro.status === 429 ? "border-moderado-line bg-moderado-bg text-[#6B4A04]" : "border-critico-line bg-critico-bg text-critico-text"
          }`}
        >
          <p className="font-semibold">{erro.texto}</p>
          {erro.status === 429 && bloqueado && (
            <p className="mt-1.5 flex items-center gap-2">
              <Timer size={15} aria-hidden /> Tente novamente em{" "}
              <b className="font-display tabular-nums" aria-live="polite">
                {espera} s
              </b>
            </p>
          )}
        </div>
      )}

      <button type="submit" disabled={ilustrativo ? false : enviando || bloqueado || !senha} className="botao mt-6 w-full py-3 text-[15.5px]" tabIndex={ilustrativo ? -1 : undefined}>
        {enviando ? "Verificando…" : bloqueado ? `Aguarde ${espera} s` : "Entrar"}
      </button>

      {USA_MOCK && !ilustrativo && (
        <p className="mt-4 rounded-lg bg-paper-deep px-3 py-2 text-[13px] text-ink-muted">
          Modo de demonstração local: a senha é <b className="text-ink">{mockApi.senhaDemo}</b>. Cinco erros seguidos bloqueiam por 30 s.
        </p>
      )}
    </form>
  );
}

export const PONTOS_SEGURANCA = [
  "Senha guardada só como hash PBKDF2 com sal, nunca em texto.",
  "Cinco tentativas erradas bloqueiam o endereço por 30 segundos.",
  "Sessão em cookie HttpOnly, assinado e SameSite=Strict.",
  "Sem senha configurada, o painel não abre: segurança por padrão.",
];

export function TelaEntrar({ ilustrativo = false }: { ilustrativo?: boolean }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(480px,44%)]">
      <aside className="relative hidden overflow-hidden bg-petrol-900 p-12 text-paper lg:flex lg:flex-col">
        <Isobaras className="pointer-events-none absolute inset-0 h-full w-full opacity-70" cx={0.35} cy={0.62} linhas={15} chuva cor="#7FA9AF" />
        <div className="relative">
          <Logo claro />
        </div>
        <div className="relative mt-auto max-w-[560px]">
          <p className="font-display text-[56px] font-extrabold leading-[0.98] tracking-[-0.045em] text-paper">
            Onde agir primeiro, antes da água.
          </p>
          <p className="mt-5 max-w-[460px] text-[18px] leading-relaxed text-petrol-100">
            Mapa, alertas com motivo e sensores ao vivo para a equipe da Defesa Civil.
          </p>
          <div className="my-10 h-px bg-petrol-300/25" aria-hidden />
          <p className="font-display text-[11.5px] font-semibold uppercase tracking-[0.16em] text-petrol-100">Como protegemos o painel</p>
          <ul className="mt-5 space-y-4">
            {PONTOS_SEGURANCA.map((p) => (
              <li key={p} className="flex gap-3 text-[17px] leading-snug text-paper/90">
                <ShieldCheck size={19} className="mt-0.5 shrink-0 text-petrol-100" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main id={ilustrativo ? undefined : "conteudo"} className="flex flex-col px-5 py-8 md:px-12">
        <div className="flex items-center justify-between">
          <span className="lg:hidden">
            <Logo />
          </span>
          <Link to="/" className="ml-auto inline-flex items-center gap-1.5 text-[14.5px] font-medium text-ink-muted hover:text-ink">
            <ArrowLeft size={15} aria-hidden /> Voltar ao site
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <CartaoLogin ilustrativo={ilustrativo} />
        </div>
        <p className={`text-center text-[13px] text-ink-faint ${ilustrativo ? "invisible" : ""}`}>É cidadão? Veja o risco do seu bairro sem login em <Link to="/meu-bairro" className="font-semibold text-petrol-700 underline underline-offset-2">Meu bairro</Link>.</p>
      </main>
    </div>
  );
}

export default function Entrar() {
  return <TelaEntrar />;
}
