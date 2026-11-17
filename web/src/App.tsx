import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation, useSearchParams } from "react-router-dom";
import { RequireAuth } from "./components/RequireAuth";
import { CarregandoTela } from "./components/CarregandoTela";

const Inicio = lazy(() => import("./pages/Inicio"));
const MeuBairro = lazy(() => import("./pages/MeuBairro"));
const Entrar = lazy(() => import("./pages/Entrar"));
const Sobre = lazy(() => import("./pages/Sobre"));
const PainelLayout = lazy(() => import("./components/PainelLayout"));
const VisaoGeral = lazy(() => import("./pages/painel/VisaoGeral"));
const Indicadores = lazy(() => import("./pages/painel/Indicadores"));
const Mapa = lazy(() => import("./pages/painel/Mapa"));
const Alertas = lazy(() => import("./pages/painel/Alertas"));
const AoVivo = lazy(() => import("./pages/painel/AoVivo"));
const Apresentacao = lazy(() => import("./pages/Apresentacao"));
const NaoEncontrada = lazy(() => import("./pages/NaoEncontrada"));

const TITULOS: Record<string, string> = {
  "/": "AlertaClima · Risco de enchente por bairro",
  "/meu-bairro": "Meu bairro · AlertaClima",
  "/entrar": "Entrar · AlertaClima",
  "/sobre": "Sobre · AlertaClima",
  "/painel": "Visão geral · AlertaClima",
  "/painel/indicadores": "Indicadores · AlertaClima",
  "/painel/mapa": "Mapa de riscos · AlertaClima",
  "/painel/alertas": "Alertas · AlertaClima",
  "/painel/ao-vivo": "Ao vivo · AlertaClima",
  "/apresentacao": "Apresentação · AlertaClima",
};

function InicioOuTour() {
  const [params] = useSearchParams();
  const modo = params.get("apresentacao");
  if (modo) return <Apresentacao modo={modo === "auto" ? "auto" : "manual"} />;
  return <Inicio />;
}

function TourRota() {
  const [params] = useSearchParams();
  return <Apresentacao modo={params.get("modo") === "manual" ? "manual" : "auto"} />;
}

export default function App() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    document.title = TITULOS[pathname] ?? "AlertaClima";
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <Suspense fallback={<CarregandoTela />}>
      <Routes>
        <Route path="/" element={<InicioOuTour />} />
        <Route path="/meu-bairro" element={<MeuBairro />} />
        <Route path="/entrar" element={<Entrar />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/apresentacao" element={<TourRota />} />
        <Route
          path="/painel"
          element={
            <RequireAuth>
              <PainelLayout />
            </RequireAuth>
          }
        >
          <Route index element={<VisaoGeral />} />
          <Route path="indicadores" element={<Indicadores />} />
          <Route path="mapa" element={<Mapa />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="ao-vivo" element={<AoVivo />} />
          <Route path="*" element={<Navigate to="/painel" replace />} />
        </Route>
        <Route path="*" element={<NaoEncontrada />} />
      </Routes>
    </Suspense>
  );
}
