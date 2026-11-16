# Fonte da verdade — nossa parte do AlertaClima

Atualizado em 2026-11-16. Branch: `aldrin/estrutura-mvp-devops`.
Este documento separa **o que foi pedido**, **o que nos propusemos a fazer** e **o que está feito**.
Onde algo não foi verificado, está escrito.

## 1. De onde vem o "pedido"

| Fonte | O que é | Verificada? |
|---|---|---|
| F1 | Resumo "Ideia de projeto: AlertaClima" postado por Joy no grupo "Fiap - projetos" em 2026-11-13 20:42 (gerado por IA a pedido dela) | Lida no WhatsApp. **É proposta do grupo, não o enunciado.** |
| F2 | Enquete do grupo de 2026-11-13 11:54 (divisão de áreas). Aldrin votou em "MVP, IoT e experiência digital" e "DevOps, segurança e qualidade" | Lida no WhatsApp |
| F3 | **Enunciado oficial da Global Solution 2026/2 no portal FIAP** | **NÃO verificado.** Portal exige login. Critérios, entregáveis e pesos oficiais são desconhecidos |
| F4 | Prazo de entrega em grupo: 2026-11-19 | Do vault (2026-11-13). Não conferido no portal |

> Enquanto F3 não for lido, a coluna "pedido" abaixo é o que **o grupo** pediu a si mesmo.
> Quando F3 for lido, esta tabela deve ser refeita contra ele.

## 2. O que nos propusemos a fazer (escopo do Aldrin)

Áreas escolhidas na enquete (F2), com o texto original de F1:

- **MVP e IoT:** "plataforma web com telas de dashboard, mapa, regiões, alertas e sensores simulados de chuva e vento".
- **DevOps:** "Docker, Git, pipeline de testes, autenticação e segurança".

Fora do nosso escopo: IA (análise de risco e geração de alertas), Big Data (ingestão, Oracle, processamento, dashboard `dashboard.py`) e vídeo pitch.

## 3. Trabalho pedido × trabalho feito

Legenda: ✅ feito e verificado · 🟡 feito, verificação parcial · ⬜ não feito · ❓ pedido incerto

| # | Pedido (F1) | Área | Status | Evidência / limite |
|---|---|---|---|---|
| R1 | Plataforma web | MVP | ✅ | `app/main.py`, Streamlit. Smoke test `tests/test_app_streamlit.py` renderiza o app |
| R2 | Telas de dashboard | MVP | ✅ | Indicadores gerais em `app/main.py`. Dashboard analítico completo é o `dashboard.py` da Joy (Big Data) |
| R3 | Mapa | MVP | 🟡 | Mapa Plotly com risco por região. Coordenadas do modo simulado são **aproximadas**; com Oracle vale `REGIOES.LATITUDE/LONGITUDE`. Não visto num navegador real |
| R4 | Regiões | MVP | ✅ | 5 bairros (Centro, Mooca, Ipiranga, Vila Mariana, Butantã), os mesmos do Big Data |
| R5 | Alertas | MVP | 🟡 | Alerta com **motivo e medidas preventivas** (`app/alertas.py`, 5 testes). Baseado em **regras**, não em IA |
| R6 | Sensores simulados de chuva e vento | IoT | 🟡 | `iot/simulador_sensores.py` e gráficos. **Simulados**; gravação no Oracle (`--gravar`) escrita mas **não testada** sem banco |
| R7 | Docker | DevOps | 🟡 | `Dockerfile` e `.dockerignore` escritos. **Build não executado** (sem Docker nesta máquina); só o CI valida |
| R8 | Git | DevOps | 🟡 | Branch e commits **locais**. Nada enviado ao GitHub da Joy |
| R9 | Pipeline de testes | DevOps | 🟡 | 20 testes passam localmente; `.github/workflows/ci.yml` **ainda não rodou** no GitHub |
| R10 | Autenticação | DevOps | ✅ | Login por senha, hash PBKDF2, bloqueio após 5 tentativas, falha fechada. 5 testes + smoke |
| R11 | Segurança | DevOps | 🟡 | `.gitignore` protege `.env`; sem segredos no código. **Não auditada por terceiros**; HTTPS e gestão de segredos em produção ficam de fora |

## 4. Dependências do que os outros fazem

- O MVP lê as tabelas do Big Data (`REGIOES`, `DADOS_CLIMATICOS`, `OCORRENCIAS`, `ANALISE_RISCO`). Sem o Oracle rodando, o app usa dados simulados e **avisa na tela**.
- A pontuação vem de `processamento/calcular_risco.py` (Joy). Se ela mudar a fórmula, `app/alertas.py` acompanha, exceto os pesos (50/20/30), duplicados em `alertas.py`.
- Os alertas por IA dependem da área de IA, que ainda não entregou.

## 5. Riscos abertos

1. **F3 não lido:** podemos estar entregando o que o grupo imaginou, e não o que a FIAP pede.
2. Prazo em **2026-11-19**, três dias depois deste documento.
3. Nada validado contra Oracle real, Docker real ou GitHub Actions.
4. Os dados do modo simulado são ilustrativos e não podem ser apresentados como dados reais.
