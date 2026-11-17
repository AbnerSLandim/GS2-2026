import { api } from "../../lib/api";
import { useRecurso } from "../../lib/hooks";
import { AlertasView } from "../../views/AlertasView";
import { Tela } from "./comum";

export default function Alertas() {
  const { dados, erro, carregando, recarregar } = useRecurso("painel", api.painel);
  return (
    <Tela titulo="Alertas" sobre="Do mais grave ao menos grave, cada alerta diz o motivo e o que fazer." fonte={dados?.fonte} atualizado={dados?.atualizado_em} erro={erro} aoTentar={recarregar} carregando={carregando && !dados}>
      {dados && <AlertasView regioes={dados.regioes} atualizadoEm={dados.atualizado_em} />}
    </Tela>
  );
}
