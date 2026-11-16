# Fonte da verdade — nossa parte do AlertaClima

Atualizado em 2026-11-16. Branch local: `aldrin/estrutura-mvp-devops` (não enviada ao GitHub).
Separa **o que foi pedido**, **o que nos propusemos a fazer** e **o que está feito**.
Onde algo não foi verificado, está escrito.

## 1. Fontes do pedido

| Fonte | O que é | Situação |
|---|---|---|
| **F1** | **Enunciado oficial FIAP "Global Solution 2026/2 — CitizenTech"** (PDF de 30 páginas, turma 4ESOA) | **Lido por inteiro em 2026-11-16.** É a fonte que manda |
| F2 | Resumo "AlertaClima" postado por Joy no grupo em 2026-11-13 | Proposta do grupo. Vale só onde não contradiz F1 |
| F3 | Enquete do grupo (divisão de áreas). Aldrin: "MVP, IoT e experiência digital" e "DevOps, segurança e qualidade" | Lida no WhatsApp |

**Regras gerais do edital (F1) que valem para o grupo todo:**

- Entrega única por grupo na plataforma, **19/11/2026 até 23h55**, sem prorrogação. Grupo de até 5; todos no `.txt`.
- O `.zip` leva: **todo o código com README de execução**, **um PDF com os entregáveis de cada parte** (arquitetura, prints, dashboards, evidências) e **um `.txt`** com nome do grupo, RM e nome de cada integrante e o link do vídeo pitch.
- Qualquer item fora das regras: **−1 ponto**. Área que não roda seguindo o README: **a área não pontua**. Tecnologia fora do conteúdo **até a fase 7**: **a área não pontua**.
- **Uso de IA generativa:** permitido para apoio; proibido entregar código ou texto gerado **sem entender e sem revisar**; deve-se **declarar no README** as ferramentas usadas e para quê.
- Vídeo pitch: até 3 minutos, link público, mostrando o site funcionando (5 pts).
- Peso: IA 4, Big Data 4, **MVP/IoT 4**, **DevOps 3**, vídeo 5 (total 20).

## 2. Nosso escopo

- **Área 3 — MVP, IoT e experiência digital (4 pts)**
- **Área 4 — DevOps, segurança e qualidade (3 pts)**

Fora do nosso escopo: IA (área 1), Big Data (área 2) e o vídeo pitch.

## 3. Rubrica oficial × o que está feito

Legenda: ✅ feito e verificado · 🟡 feito com verificação parcial ou pendência · ⬜ não feito

### Área 3 — MVP, IoT e experiência digital

| Critério (edital) | Pts | Status | Evidência e limite |
|---|---|---|---|
| 01 Protótipo: 4+ telas funcionais, web ou mobile | 1 | ✅ | 5 telas (`app/main.py`): visão geral, mapa, alertas, minha região, sensores. `test_cinco_telas_funcionam`. **Nunca visto num navegador real** |
| 02 IoT: 2+ sensores (Arduino, TinkerCad, reais ou mock) | 1 | 🟡 | 2 sensores **mock** (chuva e vento) em `iot/simulador_sensores.py`, aceitos pelo edital. Sem hardware. Gravação no Oracle (`--gravar`) escrita e testada só com banco falso |
| 03 Fluxo funcional: um uso completo, do início ao fim | 1 | 🟡 | Fluxo: login → "Minha região" → escolhe região → risco, motivo e medidas. Testado em `test_fluxo_minha_regiao_muda_com_a_escolha`. Não passa por sensor nem IA |
| 04 Arquitetura: diagrama geral com as áreas e como se conectam | 1 | 🟡 | Rascunho em ASCII em `docs/arquitetura.md`. **Falta a imagem final para o PDF** e a confirmação do que a IA vai ser |

### Área 4 — DevOps, segurança e qualidade

| Critério (edital) | Pts | Status | Evidência e limite |
|---|---|---|---|
| 01 Organização: módulos e versionado com Git | 0,5 | 🟡 | Módulos `app/`, `iot/`, `processamento/`, `sql/`, `tests/`. Git só **local**; nada enviado ao repositório da Joy |
| 02 DevOps: **evidência** de Docker, CI/CD, Jenkins ou monitoramento **funcionando** | 1 | ⬜ | `Dockerfile` e `.github/workflows/ci.yml` escritos, **mas nunca executados**. Sem Docker nesta máquina; CI só roda depois do push. **Sem evidência, não há como pontuar** |
| 03 Segurança: 2+ práticas | 0,5 | ✅ | (1) autenticação com hash PBKDF2 e sal; (2) bloqueio após 5 tentativas (por sessão); (3) segredos fora do Git (`.gitignore`, `.dockerignore`); (4) falha fechada sem senha configurada; (5) erro do banco não vai para a tela. Testes T05–T08, T14, T15 |
| 04 Testes: plano com 5+ casos e evidências da execução | 1 | ✅ | `docs/PLANO_DE_TESTES.md` (15 casos) e `docs/evidencias/pytest_2026-11-16.txt` (29 passaram) |

Não estimo a nota: a avaliação é de professores.

## 4. Pendências que travam pontos

1. **Evidência de DevOps (1 pt):** exige enviar a branch ao GitHub para o Actions rodar (e/ou subir o Docker numa máquina com Docker) e tirar print. Decisão do Aldrin; o repositório é da Joy.
2. **Diagrama final da arquitetura (1 pt):** depende de a área de IA dizer o que entrega.
3. **Conteúdo até a fase 7:** **não verificado** se Streamlit, Plotly e python-oracledb estão no conteúdo até a fase 7. Se não estiverem, o edital diz que a área não pontua. Confirmar com o grupo/professor.
4. **Cada área tem que rodar só pelo README.** O README da raiz é da Joy e descreve só o Big Data. Falta ele cobrir o MVP, o simulador e o login (hoje isso está em `app/README.md`).
5. **Declaração de uso de IA no README:** o código do MVP foi escrito com apoio do Claude Code (Anthropic). Precisa constar no README e **o Aldrin precisa ler e entender o código antes de entregar**; o edital proíbe entregar código gerado sem entender e sem revisar.
6. **Pacote de entrega:** `.zip`, PDF e `.txt` com RM de todos. Falta reunir os RMs do grupo e o link do vídeo.

## 5. Integração entre áreas (diferencial, não soma nota)

| Diferencial do edital | Situação |
|---|---|
| Áreas integradas (sensores alimentam o dashboard; IA usa os dados do pipeline) | **Não**. Os sensores só aparecem na tela de sensores; o risco usa a previsão |
| Pipeline ponta a ponta (commit → build, testes e deploy) | Parcial no papel: CI roda testes e build. **Deploy não existe**. Nada executado |
| IA medida | Fora do nosso escopo |
| Validado com gente real | **Não**. Ninguém do público testou |

## 6. Limites que não podem ser omitidos na apresentação

- Os dados do modo simulado são ilustrativos. Não apresentar como dados reais.
- A pontuação de risco é experimental e não substitui a Defesa Civil.
- O login é por senha única compartilhada, sem usuário e sem logout. Para um MVP é aceitável; para um app público de alertas, o ideal seria alerta público e área administrativa protegida.
- O bloqueio de tentativas vale por sessão do navegador e pode ser contornado abrindo outra aba.
