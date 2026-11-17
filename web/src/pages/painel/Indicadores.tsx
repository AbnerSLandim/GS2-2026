import { api } from "../../lib/api";
import { useRecurso } from "../../lib/hooks";
import { IndicadoresView } from "../../views/IndicadoresView";
import { Tela } from "./comum";

export default function Indicadores() {
  const { dados, erro, carregando, recarregar } = useRecurso("indicadores", api.indicadores);
  return (
    <Tela
      titulo="Indicadores"
      sobre="Módulo de Big Data e visualização — Joy. Ranking, tendência, previsão e histórico de ocorrências."
      fonte={dados?.fonte}
      erro={erro}
      aoTentar={recarregar}
      carregando={carregando && !dados}
    >
      {dados && <IndicadoresView dados={dados} />}
    </Tela>
  );
}
