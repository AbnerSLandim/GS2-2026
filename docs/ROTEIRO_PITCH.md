# Roteiro do vídeo pitch — AlertaClima

Base gravada com o modo apresentação do app (`?apresentacao=auto`), ~3 min.
O edital pede **até 3 minutos**, link público e **o site funcionando** (nada de só slides).
Quem apresenta narra por cima do vídeo seguindo a tabela abaixo.

| Tempo | Tela do vídeo | O que falar (sugestão) |
|---|---|---|
| 0:00–0:16 | O problema | "Todo ano bairros de São Paulo alagam. A previsão do tempo existe, mas não diz se a **sua** região corre risco, nem o que fazer." |
| 0:16–0:32 | A solução | "O AlertaClima cruza a previsão de chuva e vento com o histórico de ocorrências de cada bairro e diz o risco, o motivo e o que fazer." |
| 0:32–0:45 | Acesso protegido | "O painel é protegido por senha, com hash e bloqueio de tentativas." |
| 0:45–1:02 | Visão geral | "Aqui a cidade em um olhar: quantas regiões estão em alerta e onde chove mais." |
| 1:02–1:19 | Mapa | "No mapa, cada bolha é um bairro: a cor é o nível de risco." |
| 1:19–1:37 | Alertas | "Cada alerta explica o motivo e traz as medidas preventivas daquele nível." |
| 1:37–1:52 | Minha região: Butantã | "O cidadão escolhe onde mora. No Butantã o risco é crítico, e ele já recebe o que fazer e os telefones de emergência." |
| 1:52–2:02 | Minha região: Centro | "No Centro, risco baixo: o sistema não alarma à toa." |
| 2:02–2:16 | Sensores | "Os sensores de chuva e vento alimentam o painel hora a hora. Nesta demo, são simulados." |
| 2:16–2:31 | Por trás do produto | "Cada mudança roda 30 testes no GitHub Actions e gera a imagem Docker." |
| 2:31–2:46 | Impacto | "Ganha o morador, que se prepara antes, e a Defesa Civil, que sabe onde agir. ODS 11 e 13." |
| 2:46–2:58 | Fechamento | "Não basta prever a chuva: o AlertaClima avisa quem está em risco, por quê e o que fazer." |

## Encaixe das outras áreas

- **IA (área 1):** se a IA gerar ou classificar o alerta, mostrar a tela dela entre "Alertas" e "Minha região" (cortar ~10 s de "Visão geral" para caber).
- **Big Data (área 2):** o `dashboard.py` pode entrar no lugar de "Visão geral" se precisar de tempo.

## Regras do edital para não perder pontos

- Até 3:00; o que passar não é avaliado.
- Link público (YouTube, Drive ou Vimeo), testado em aba anônima.
- Link no `.txt` da entrega e no README.
- Dados da demo são simulados: dizer isso, não apresentar como dados reais.
