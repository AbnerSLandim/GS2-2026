import { CabecalhoTela } from "../../components/PainelLayout";
import { SeloFonte } from "../../components/ui";
import { AoVivoView } from "../../views/AoVivoView";

export default function AoVivo() {
  return (
    <div className="mx-auto max-w-[1520px] px-5 py-8 md:px-10 md:py-10">
      <CabecalhoTela titulo="Sensores ao vivo" sobre="Leituras chegando em tempo real e o risco recalculado a cada uma." direita={<SeloFonte fonte="SIMULADO" />} />
      <div className="mt-8">
        <AoVivoView origem="api" />
      </div>
    </div>
  );
}
