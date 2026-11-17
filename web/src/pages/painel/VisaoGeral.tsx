import { api } from "../../lib/api";
import { useRecurso } from "../../lib/hooks";
import { VisaoGeralView } from "../../views/VisaoGeralView";
import { Tela } from "./comum";

export default function VisaoGeral() {
  const { dados, erro, carregando, recarregar } = useRecurso("painel", api.painel);
  return (
    <Tela titulo="Visão geral" sobre="A cidade em um olhar: onde o risco está e por quê." fonte={dados?.fonte} atualizado={dados?.atualizado_em} erro={erro} aoTentar={recarregar} carregando={carregando && !dados}>
      {dados && <VisaoGeralView indicadores={dados.indicadores} regioes={dados.regioes} />}
    </Tela>
  );
}
