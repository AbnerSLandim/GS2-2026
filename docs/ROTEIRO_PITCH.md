# Roteiro do vídeo pitch — AlertaClima

Vídeo base: `video/AlertaClima_pitch_base.mp4` (1080p, 2:58), gravado com o modo apresentação
do app (`?apresentacao=auto`). O edital pede **até 3 minutos**, link público e **o site funcionando**.
Quem apresenta narra por cima seguindo a tabela. Tempos aproximados (±2 s).

| Tempo | Tela do vídeo | O que falar (sugestão) |
|---|---|---|
| 0:00–0:14 | O problema | "Todo ano bairros de São Paulo alagam. A previsão do tempo existe, mas não diz se a **sua** região corre risco, nem o que fazer." |
| 0:14–0:28 | A solução | "O AlertaClima cruza previsão de chuva e vento com o histórico de ocorrências de cada bairro e diz o risco, o motivo e o que fazer." |
| 0:28–0:38 | Acesso protegido | "O painel é protegido por senha, com hash e bloqueio de tentativas." |
| 0:38–0:53 | Visão geral | "A cidade em um olhar: quantas regiões estão em alerta e onde chove mais." |
| 0:53–1:08 | Mapa | "No mapa, cada bolha é um bairro; a cor é o nível de risco." |
| 1:08–1:24 | Alertas | "Cada alerta explica o motivo e traz as medidas preventivas daquele nível." |
| 1:24–1:38 | Minha região: Butantã | "O cidadão escolhe onde mora. No Butantã o risco é crítico, com o que fazer e os telefones de emergência." |
| 1:38–1:47 | Minha região: Centro | "No Centro, risco baixo: o sistema não alarma à toa." |
| 1:47–2:13 | Sensores ao vivo | "Agora os sensores de chuva e vento enviando dados em tempo real. Uma frente de chuva chega, as leituras sobem e o risco de cada bairro é recalculado na hora. Aqui os sensores são simulados." |
| 2:13–2:26 | Por trás do produto | "Cada mudança roda os testes automatizados no GitHub Actions e gera a imagem Docker." |
| 2:26–2:39 | Impacto | "Ganha o morador, que se prepara antes, e a Defesa Civil, que sabe onde agir. ODS 11 e 13." |
| 2:39–2:58 | Fechamento | "Não basta prever a chuva: o AlertaClima avisa quem está em risco, por quê e o que fazer." |

## Encaixe das outras áreas

- **IA (área 1):** se a IA gerar ou classificar o alerta, mostrar a tela dela entre "Alertas" e "Minha região"; cortar ~10 s de "Visão geral" e ~5 s de "Por trás do produto" para caber.
- **Big Data (área 2):** o `dashboard.py` pode substituir "Visão geral".

## Como regravar

1. `streamlit run app/main.py` com `APP_AUTH=off` **só localmente**, ou entrar com a senha.
2. Abrir `http://localhost:8501/?apresentacao=auto` em tela cheia (F11) e gravar a tela.
3. `?apresentacao=1` mostra botões ◀ ▶ para apresentar ao vivo no próprio ritmo.

## Regras do edital

- Até 3:00; o que passar não é avaliado.
- Link público (YouTube, Drive ou Vimeo), testado em aba anônima; link no `.txt` e no README.
- Os dados da demo são simulados: dizer isso, não apresentar como dados reais.
