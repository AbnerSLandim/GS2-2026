import { Marca } from "./Logo";

export function CarregandoTela() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-ink-muted">
        <span className="animate-pulse">
          <Marca tamanho={22} />
        </span>
        <span className="text-[15px]">Carregando…</span>
      </div>
    </div>
  );
}
