import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, Map as LMap } from "leaflet";
import type { Regiao } from "../lib/types";
import { nomeBairro, num, ROTULO_NIVEL, textoBr } from "../lib/format";
import { COR_NIVEL, ICONE_NIVEL, SeloNivel, TEXTO_NIVEL } from "../components/nivel";
import { ORDEM_NIVEIS } from "../lib/risco";

function Ajustar({ limites, selecionada, regioes }: { limites: LatLngBoundsExpression; selecionada: string | null; regioes: Regiao[] }) {
  const mapa = useMap();
  useEffect(() => {
    // as transições de tela mudam o tamanho do contêiner: recalcula depois delas
    const t = [60, 400, 900].map((ms) =>
      window.setTimeout(() => {
        mapa.invalidateSize();
        if (!selecionada) mapa.fitBounds(limites, { padding: [70, 70], maxZoom: 13 });
      }, ms),
    );
    return () => t.forEach(clearTimeout);
  }, [mapa, limites, selecionada]);
  useEffect(() => {
    const r = regioes.find((x) => x.nome === selecionada);
    if (r) mapa.flyTo([r.lat, r.lon], 14, { duration: 0.8 });
  }, [selecionada, regioes, mapa]);
  return null;
}

const raio = (p: number) => 14 + (p / 100) * 30;

export function MapaView({
  regioes,
  altura = "calc(100vh - 220px)",
  lista = true,
  controles = true,
}: {
  regioes: Regiao[];
  altura?: string;
  lista?: boolean;
  controles?: boolean;
}) {
  const [sel, setSel] = useState<string | null>(null);
  const [, setMapa] = useState<LMap | null>(null);
  const limites = useMemo<LatLngBoundsExpression>(() => {
    const lats = regioes.map((r) => r.lat);
    const lons = regioes.map((r) => r.lon);
    return [
      [Math.min(...lats), Math.min(...lons)],
      [Math.max(...lats), Math.max(...lons)],
    ];
  }, [regioes]);

  return (
    <div className={`grid gap-6 ${lista ? "xl:grid-cols-[1fr_340px]" : ""}`}>
      <div className="relative overflow-hidden rounded-2xl border border-rule" style={{ height: altura, minHeight: 420 }}>
        <MapContainer
          center={[-23.572, -46.66]}
          zoom={13}
          scrollWheelZoom={false}
          zoomControl={controles}
          ref={setMapa}
          style={{ height: "100%", width: "100%" }}
          attributionControl
        >
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
            className="tiles-claros"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Ajustar limites={limites} selecionada={sel} regioes={regioes} />
          {[...regioes].reverse().map((r) => (
            <CircleMarker
              key={r.nome + "-halo"}
              center={[r.lat, r.lon]}
              radius={raio(r.pontuacao) + 14}
              pathOptions={{ stroke: false, fillColor: COR_NIVEL[r.nivel], fillOpacity: 0.12 }}
              interactive={false}
            />
          ))}
          {[...regioes].reverse().map((r) => (
            <CircleMarker
              key={r.nome}
              center={[r.lat, r.lon]}
              radius={raio(r.pontuacao)}
              pathOptions={{ color: "#FBFAF7", weight: 2.5, fillColor: COR_NIVEL[r.nivel], fillOpacity: 0.82 }}
              eventHandlers={{ click: () => setSel(r.nome) }}
            >
              <Tooltip direction="top" offset={[0, -raio(r.pontuacao)]} permanent className="rotulo-mapa">
                {nomeBairro(r.nome)} <span style={{ color: TEXTO_NIVEL[r.nivel] }}>· {ROTULO_NIVEL[r.nivel]}</span>
              </Tooltip>
              <Popup>
                <div className="p-4">
                  <SeloNivel nivel={r.nivel} tamanho="sm" />
                  <p className="mt-2 font-display text-[20px] font-bold tracking-[-0.03em] text-ink">{nomeBairro(r.nome)}</p>
                  <p className="mt-0.5 text-[13px] text-ink-muted">
                    Pontuação <b className="tabular-nums" style={{ color: TEXTO_NIVEL[r.nivel] }}>{num(r.pontuacao, 1)}</b> de 100
                  </p>
                  <p className="mt-2.5 border-t border-rule pt-2.5 text-[14px] leading-snug text-ink-soft">{textoBr(r.alerta.motivo)}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* legenda própria */}
        <div className="pointer-events-none absolute right-4 top-4 z-[500] rounded-xl border border-rule bg-paper-card/95 px-4 py-3">
          <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Nível de risco</p>
          <ul className="mt-2 space-y-1.5">
            {[...ORDEM_NIVEIS].reverse().map((n) => {
              const I = ICONE_NIVEL[n];
              return (
                <li key={n} className="flex items-center gap-2 text-[13.5px] font-medium text-ink-soft">
                  <span className="h-3 w-3 rounded-full" style={{ background: COR_NIVEL[n] }} aria-hidden />
                  <I size={13} style={{ color: TEXTO_NIVEL[n] }} aria-hidden />
                  {ROTULO_NIVEL[n]}
                </li>
              );
            })}
          </ul>
          <p className="mt-2 border-t border-rule pt-2 text-[12px] text-ink-muted">Tamanho do círculo = pontuação</p>
        </div>
      </div>

      {lista && (
        <ol className="space-y-2">
          {regioes.map((r) => (
            <li key={r.nome}>
              <button
                onClick={() => setSel(r.nome)}
                className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3 text-left transition-colors ${
                  sel === r.nome ? "border-ink bg-paper-card" : "border-rule bg-paper-card/60 hover:border-rule-strong"
                }`}
                aria-pressed={sel === r.nome}
              >
                <span className="h-9 w-1 rounded-full" style={{ background: COR_NIVEL[r.nivel] }} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[16px] font-semibold tracking-[-0.015em]">{nomeBairro(r.nome)}</span>
                  <span className="flex items-center gap-1.5 text-[13.5px] font-semibold" style={{ color: TEXTO_NIVEL[r.nivel] }}>
                    {(() => {
                      const I = ICONE_NIVEL[r.nivel];
                      return <I size={13} aria-hidden />;
                    })()}
                    {ROTULO_NIVEL[r.nivel]}
                  </span>
                </span>
                <span className="font-display text-[24px] font-bold tabular-nums tracking-[-0.04em]">{num(r.pontuacao, 1)}</span>
              </button>
            </li>
          ))}
          <li className="px-1 pt-2 text-[13px] text-ink-muted">Clique em uma região para aproximar no mapa.</li>
        </ol>
      )}
    </div>
  );
}

export default MapaView;
