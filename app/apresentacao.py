"""
AlertaClima - Modo apresentacao (base do video pitch)

Abre com ?apresentacao=auto (avanca sozinho) ou ?apresentacao=1 (botoes).
Segue a estrutura de pitch do edital: problema -> solucao -> demonstracao
-> impacto -> fechamento. NAO desliga o login: so funciona depois de entrar
(ou com APP_AUTH=off, apenas localmente).
"""

import time

# ============================================================
# 1. ROTEIRO (passo a passo do video)
# ============================================================

PASSOS = [
    {
        "id": "abertura",
        "etapa": "O problema",
        "titulo": "Chove, alaga e a população descobre tarde demais",
        "texto": [
            "Bairros de São Paulo sofrem com enchentes, alagamentos e deslizamentos todo ano.",
            "A previsão do tempo existe, mas não diz se a SUA rua corre risco nem o que fazer.",
            "Quem mais sofre são os moradores das regiões que já foram atingidas antes.",
        ],
        "tela": None,
        "segundos": 14,
    },
    {
        "id": "solucao",
        "etapa": "A solução",
        "titulo": "AlertaClima: risco por bairro, com motivo e o que fazer",
        "texto": [
            "Cruza previsão de chuva e vento com o histórico de ocorrências de cada bairro.",
            "Classifica o risco de BAIXO a CRÍTICO e explica por quê.",
            "Entrega medidas preventivas claras para o cidadão se preparar antes.",
        ],
        "tela": None,
        "segundos": 14,
    },
    {
        "id": "seguranca",
        "etapa": "Demonstração · acesso",
        "titulo": "Acesso protegido",
        "texto": [
            "O painel só abre com senha (hash PBKDF2 com sal, nunca a senha em texto).",
            "Cinco tentativas erradas bloqueiam o acesso por 30 segundos.",
            "Sem senha configurada, o sistema não abre: segurança por padrão.",
        ],
        "tela": "login",
        "segundos": 10,
    },
    {
        "id": "visao_geral",
        "etapa": "Demonstração · 1 de 5",
        "titulo": "Visão geral: a cidade em um olhar",
        "texto": [
            "Quantas regiões estão em alerta e onde a chuva e o vento são maiores.",
            "Tabela com nível de risco e histórico de ocorrências de cada bairro.",
        ],
        "tela": "visao_geral",
        "segundos": 15,
    },
    {
        "id": "mapa",
        "etapa": "Demonstração · 2 de 5",
        "titulo": "Mapa de riscos",
        "texto": [
            "Cada bolha é um bairro: a cor mostra o nível e o tamanho, a pontuação.",
            "Em segundos se vê onde agir primeiro.",
        ],
        "tela": "mapa",
        "segundos": 15,
    },
    {
        "id": "alertas",
        "etapa": "Demonstração · 3 de 5",
        "titulo": "Alertas que explicam",
        "texto": [
            "Do mais grave ao menos grave, cada alerta diz o MOTIVO.",
            "E traz as medidas preventivas certas para aquele nível de risco.",
        ],
        "tela": "alertas",
        "segundos": 16,
    },
    {
        "id": "regiao_critica",
        "etapa": "Demonstração · 4 de 5 · fluxo do cidadão",
        "titulo": "Minha região: o cidadão escolhe onde mora",
        "texto": [
            "Butantã: risco CRÍTICO. Chuva forte, vento e histórico de ocorrências.",
            "A orientação é direta, incluindo os telefones da Defesa Civil e dos Bombeiros.",
        ],
        "tela": "minha_regiao",
        "regiao": "Butanta",
        "segundos": 14,
    },
    {
        "id": "regiao_baixa",
        "etapa": "Demonstração · 4 de 5 · fluxo do cidadão",
        "titulo": "Mesma pergunta, outra região",
        "texto": [
            "Centro: risco BAIXO. O sistema não alarma à toa.",
        ],
        "tela": "minha_regiao",
        "regiao": "Centro",
        "segundos": 9,
    },
    {
        "id": "ao_vivo",
        "etapa": "Demonstração · 5 de 5 · IoT ao vivo",
        "titulo": "Sensores enviando dados em tempo real",
        "texto": [
            "Cada bairro envia leituras de chuva e vento; o risco é recalculado a cada leitura.",
            "Acompanhe uma frente de chuva chegando e os alertas mudando na hora (dados simulados).",
        ],
        "tela": "ao_vivo",
        "segundos": 26,
    },
    {
        "id": "devops",
        "etapa": "Por trás do produto",
        "titulo": "Engenharia que sustenta o alerta",
        "texto": [
            "Cada mudança no código roda 30 testes automatizados no GitHub Actions.",
            "A aplicação é empacotada em Docker, pronta para rodar em qualquer servidor.",
            "Segredos fora do código e dados organizados em Oracle.",
        ],
        "tela": None,
        "segundos": 13,
    },
    {
        "id": "impacto",
        "etapa": "Impacto",
        "titulo": "Quem ganha com o AlertaClima",
        "texto": [
            "Moradores: sabem o risco do próprio bairro e o que fazer antes da chuva.",
            "Defesa Civil e prefeitura: enxergam onde priorizar a ação.",
            "ODS 11 (cidades sustentáveis) e ODS 13 (ação contra a mudança do clima).",
        ],
        "tela": None,
        "segundos": 13,
    },
    {
        "id": "fechamento",
        "etapa": "Fechamento",
        "titulo": "Informação que chega antes da água",
        "texto": [
            "Não basta prever a chuva: o AlertaClima diz quem está em risco, por quê e o que fazer.",
            "AlertaClima · FIAP Global Solution 2026/2 · CitizenTech",
        ],
        "tela": None,
        "segundos": 10,
    },
]

DURACAO_TOTAL = sum(p["segundos"] for p in PASSOS)


# ============================================================
# 2. ESTILO
# ============================================================

CSS = """
<style>
[data-testid="stSidebar"], [data-testid="stSidebarCollapsedControl"],
header[data-testid="stHeader"], [data-testid="stToolbar"] { display: none !important; }
.block-container { padding: 1.4rem 3.5rem 1rem !important; max-width: 1640px !important; }
/* esconde restos do passo anterior (o Streamlit os marca como "stale") */
[data-stale="true"] { display: none !important; }
.ac-legenda {
  border: 1px solid #3a3a44; border-left: 6px solid #c8281e; border-radius: 12px;
  background: linear-gradient(135deg, #1c1d24 0%, #23242d 100%);
  padding: 16px 22px; margin-bottom: 18px;
}
.ac-etapa { color: #ff7a6b; font-size: 0.82rem; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; }
.ac-titulo { color: #fff; font-size: 1.65rem; font-weight: 800; margin: 2px 0 8px; }
.ac-texto { color: #d6d6de; font-size: 1.05rem; margin: 0; padding-left: 1.1rem; }
.ac-texto li { margin: 3px 0; }
.ac-progresso { height: 4px; background: #33343d; border-radius: 4px; margin-top: 12px; }
.ac-progresso > div { height: 4px; background: #c8281e; border-radius: 4px; }
.ac-slide { min-height: 70vh; display: flex; flex-direction: column; justify-content: center;
  padding: 0 4vw; }
.ac-slide .ac-titulo { font-size: 2.9rem; line-height: 1.15; margin: 8px 0 22px; }
.ac-slide .ac-texto { font-size: 1.45rem; }
.ac-slide .ac-texto li { margin: 10px 0; }
.ac-marca { color: #9a9aa6; font-size: 1rem; margin-top: 28px; }
.ac-login { max-width: 420px; margin: 30px auto; border: 1px solid #3a3a44;
  border-radius: 12px; padding: 22px 26px; background: #1c1d24; }
.ac-login h3 { margin: 0 0 14px; color: #fff; }
.ac-campo { border: 1px solid #44454f; border-radius: 8px; padding: 10px 12px;
  color: #8d8d99; margin: 6px 0 14px; letter-spacing: .25em; }
.ac-botao { background: #c8281e; color: #fff; text-align: center; border-radius: 8px;
  padding: 9px; font-weight: 700; }
</style>
"""


def _lista(texto):
    return "".join(f"<li>{linha}</li>" for linha in texto)


def _progresso(indice):
    feito = sum(p["segundos"] for p in PASSOS[: indice + 1])
    return int(100 * feito / DURACAO_TOTAL)


def legenda(st, passo, indice):
    st.markdown(
        f"""<div class="ac-legenda">
<div class="ac-etapa">{passo['etapa']}</div>
<div class="ac-titulo">{passo['titulo']}</div>
<ul class="ac-texto">{_lista(passo['texto'])}</ul>
<div class="ac-progresso"><div style="width:{_progresso(indice)}%"></div></div>
</div>""",
        unsafe_allow_html=True,
    )


def slide(st, passo, indice):
    st.markdown(
        f"""<div class="ac-slide">
<div class="ac-etapa">🌧️ AlertaClima · {passo['etapa']}</div>
<div class="ac-titulo">{passo['titulo']}</div>
<ul class="ac-texto">{_lista(passo['texto'])}</ul>
<div class="ac-progresso"><div style="width:{_progresso(indice)}%"></div></div>
<div class="ac-marca">FIAP Global Solution 2026/2 · CitizenTech</div>
</div>""",
        unsafe_allow_html=True,
    )


def login_ilustrativo(st):
    """Mostra como e a tela de login, sem desligar a autenticacao real."""
    st.markdown(
        """<div class="ac-login">
<h3>🔒 AlertaClima</h3>
<div>Senha de acesso</div>
<div class="ac-campo">••••••••••</div>
<div class="ac-botao">Entrar</div>
</div>""",
        unsafe_allow_html=True,
    )


# ============================================================
# 3. EXECUCAO
# ============================================================

def executar(st, telas, modo):
    """telas: dict id -> funcao(regiao=None). modo: 'auto' ou 'manual'."""
    st.markdown(CSS, unsafe_allow_html=True)

    indice = st.session_state.get("ac_passo", 0)
    indice = max(0, min(indice, len(PASSOS) - 1))
    passo = PASSOS[indice]

    # O conteudo vai num container criado ANTES dos espacos vazios: assim os
    # restos da tela anterior somem antes de desenhar a nova (sem "fantasma").
    # st.empty() troca o bloco inteiro a cada passo, apagando os filhos antigos.
    area = st.empty()

    with area.container():
        if passo["tela"] is None:
            slide(st, passo, indice)
        else:
            legenda(st, passo, indice)
            if passo["tela"] == "login":
                login_ilustrativo(st)
            elif passo["tela"] == "minha_regiao":
                telas["minha_regiao"](regiao=passo.get("regiao"))
            elif passo["tela"] == "ao_vivo":
                from app import ao_vivo

                ao_vivo.executar(st, segundos=passo["segundos"] - 2)
                passo = {**passo, "segundos": 2}  # o streaming ja consumiu o tempo
            else:
                telas[passo["tela"]]()

    if modo == "manual":
        c1, c2, c3 = st.columns([1, 6, 1])
        if c1.button("◀ Voltar", disabled=indice == 0):
            st.session_state["ac_passo"] = indice - 1
            st.rerun()
        c2.caption(f"Passo {indice + 1} de {len(PASSOS)}")
        if c3.button("Avançar ▶", disabled=indice == len(PASSOS) - 1):
            st.session_state["ac_passo"] = indice + 1
            st.rerun()
        return

    # modo automatico: espera o tempo do passo e avanca (para no ultimo)
    if indice < len(PASSOS) - 1:
        time.sleep(passo["segundos"])
        st.session_state["ac_passo"] = indice + 1
        st.rerun()
