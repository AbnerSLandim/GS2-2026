import { api } from "../../lib/api";
import { useRecurso } from "../../lib/hooks";
import { MapaView } from "../../views/MapaView";
import { Tela } from "./comum";

export default function Mapa() {
  const { dados, erro, carregando, recarregar } = useRecurso("painel", api.painel);
  return (
    <Tela titulo="Mapa de riscos" sobre="Cada círculo é uma região: a cor mostra o nível e o tamanho, a pontuação." fonte={dados?.fonte} atualizado={dados?.atualizado_em} erro={erro} aoTentar={recarregar} carregando={carregando && !dados}>
      {dados && <MapaView regioes={dados.regioes} />}
    </Tela>
  );
}
