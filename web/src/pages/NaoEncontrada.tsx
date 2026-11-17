import { Link } from "react-router-dom";
import { PaginaPublica } from "../components/Site";

export default function NaoEncontrada() {
  return (
    <PaginaPublica>
      <section className="mx-auto max-w-[1320px] px-5 py-24 md:px-10">
        <p className="numero-display text-[120px] text-ink-faint">404</p>
        <h1 className="mt-4 text-[36px] font-bold tracking-[-0.04em]">Esta página não existe.</h1>
        <p className="mt-2 text-ink-muted">O endereço pode ter mudado.</p>
        <Link to="/" className="link-seta mt-6">
          Voltar ao início
        </Link>
      </section>
    </PaginaPublica>
  );
}
