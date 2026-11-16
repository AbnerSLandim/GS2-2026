
import os
import sys

# Permite `from app import ...` quando executado com `streamlit run app/main.py`.
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import plotly.express as px
import streamlit as st
from dotenv import load_dotenv

from app import dados
from app.alertas import ORDEM_NIVEIS
from app.seguranca import exigir_login


# ============================================================
# 1. CONFIGURACAO
# ============================================================

load_dotenv()

st.set_page_config(
    page_title="AlertaClima - MVP",
    page_icon="🌧️",
    layout="wide"
)

exigir_login(st)

CORES_NIVEL = {
    "BAIXO": "#2e9e5b",
    "MODERADO": "#e0b400",
    "ALTO": "#e8741c",
    "CRITICO": "#c8281e",
}
ICONES_NIVEL = {"BAIXO": "🟢", "MODERADO": "🟡", "ALTO": "🟠", "CRITICO": "🔴"}

TELAS = [
    "🏠 Visão geral",
    "🗺️ Mapa de riscos",
    "🚨 Alertas",
    "📍 Minha região",
    "📡 Sensores",
]


# ============================================================
# 2. CARREGAMENTO DOS DADOS
# ============================================================

@st.cache_data(ttl=60)
def carregar_painel_cache(horas):
    return dados.carregar_painel(horas)


@st.cache_data(ttl=60)
def carregar_sensores_cache():
    return dados.carregar_sensores()


st.sidebar.title("🌧️ AlertaClima")

tela = st.sidebar.radio("Telas", TELAS)

st.sidebar.header("Filtros")

# O filtro de periodo so faz sentido com previsao real (Oracle).
if dados.oracle_configurado():
    horas = st.sidebar.selectbox(
        "Período da previsão",
        options=[24, 48],
        format_func=lambda x: f"Próximas {x} horas"
    )
else:
    horas = 24

niveis_selecionados = st.sidebar.multiselect(
    "Níveis de risco",
    options=ORDEM_NIVEIS,
    default=ORDEM_NIVEIS
)

df_painel, fonte, aviso = carregar_painel_cache(horas)

df_filtrado = df_painel[df_painel["NIVEL_RISCO"].isin(niveis_selecionados)].copy()
alertas_lista = [
    a for a in dados.painel_para_alertas(df_painel)
    if a["nivel"] in niveis_selecionados
]


def mostrar_origem_dos_dados():
    """Deixa claro, em toda tela, se os dados sao reais ou simulados."""
    if aviso:
        st.warning(aviso)

    if fonte == "SIMULADO":
        st.info(
            "🧪 Dados SIMULADOS para demonstração: chuva e vento vêm das "
            "últimas 24 h de sensores simulados, não de uma previsão. "
            "Configure o Oracle no arquivo .env para ver os dados do projeto."
        )
    else:
        st.success(
            "Dados lidos do Oracle. O nível de risco vem da última análise "
            "registrada; a chuva e o vento são da previsão das próximas "
            f"{horas} h."
        )

    sem_analise = df_painel[df_painel["NIVEL_RISCO"].isna()]["NOME_REGIAO"].tolist()
    if sem_analise:
        st.warning(
            "Regiões sem análise de risco (fora do mapa e dos alertas): "
            + ", ".join(sem_analise)
        )


# ============================================================
# 3. TELA 1 - VISAO GERAL
# ============================================================

def tela_visao_geral():
    st.title("🏠 Visão geral")
    st.markdown(
        "Veja quais regiões podem ser mais afetadas por chuva e vento "
        "e o que fazer para se preparar."
    )
    mostrar_origem_dos_dados()

    c1, c2, c3, c4 = st.columns(4)

    c1.metric("Regiões monitoradas", len(df_painel))
    c2.metric(
        "Regiões em alerta (alto ou crítico)",
        int(df_painel["NIVEL_RISCO"].isin(["ALTO", "CRITICO"]).sum())
    )
    c3.metric(
        "Chuva máxima",
        f"{df_painel['CHUVA_PREVISTA'].max():.1f} mm" if not df_painel.empty else "-"
    )
    c4.metric(
        "Vento máximo",
        f"{df_painel['VENTO_MAXIMO'].max():.0f} km/h" if not df_painel.empty else "-"
    )
    st.caption(
        "Chuva e vento: previsão das próximas horas (Oracle)."
        if fonte == "ORACLE" else
        "Chuva e vento: últimas 24 h dos sensores SIMULADOS, não é previsão."
    )

    st.subheader("Regiões e histórico de ocorrências")
    st.dataframe(
        df_filtrado[
            ["NOME_REGIAO", "NIVEL_RISCO", "PONTUACAO_RISCO",
             "CHUVA_PREVISTA", "VENTO_MAXIMO", "TOTAL_OCORRENCIAS"]
        ].rename(columns={
            "NOME_REGIAO": "Região",
            "NIVEL_RISCO": "Nível de risco",
            "PONTUACAO_RISCO": "Pontuação",
            "CHUVA_PREVISTA": "Chuva (mm)",
            "VENTO_MAXIMO": "Vento máx. (km/h)",
            "TOTAL_OCORRENCIAS": "Ocorrências no histórico",
        }),
        use_container_width=True,
        hide_index=True
    )


# ============================================================
# 4. TELA 2 - MAPA DE RISCOS
# ============================================================

def tela_mapa():
    st.title("🗺️ Mapa de riscos")
    mostrar_origem_dos_dados()

    df_mapa = df_filtrado.dropna(
        subset=["LATITUDE", "LONGITUDE", "PONTUACAO_RISCO"]
    )

    if df_mapa.empty:
        st.info("Nenhuma região com coordenadas e análise para os filtros selecionados.")
        return

    funcao_mapa = getattr(px, "scatter_map", None) or px.scatter_mapbox
    estilo = {"map_style": "open-street-map"} if hasattr(px, "scatter_map") \
        else {"mapbox_style": "open-street-map"}

    fig_mapa = funcao_mapa(
        df_mapa,
        lat="LATITUDE",
        lon="LONGITUDE",
        color="NIVEL_RISCO",
        size="PONTUACAO_RISCO",
        size_max=40,
        hover_name="NOME_REGIAO",
        hover_data={"PONTUACAO_RISCO": True, "CHUVA_PREVISTA": ":.1f",
                    "VENTO_MAXIMO": ":.0f", "TOTAL_OCORRENCIAS": True,
                    "LATITUDE": False, "LONGITUDE": False},
        color_discrete_map=CORES_NIVEL,
        category_orders={"NIVEL_RISCO": ORDEM_NIVEIS},
        center=dados.centro_do_mapa(df_mapa),
        zoom=10.5,
        height=520,
        **estilo
    )
    fig_mapa.update_layout(margin={"l": 0, "r": 0, "t": 0, "b": 0})
    st.plotly_chart(fig_mapa, use_container_width=True)


# ============================================================
# 5. TELA 3 - ALERTAS
# ============================================================

def mostrar_alerta(alerta, expandido):
    icone = ICONES_NIVEL[alerta["nivel"]]
    with st.expander(
        f"{icone} {alerta['regiao']} — {alerta['nivel']} "
        f"({alerta['pontuacao']:.0f}/100)",
        expanded=expandido
    ):
        st.markdown(f"**Motivo:** {alerta['motivo']}")
        if alerta["data_analise"] is not None:
            st.caption(f"Análise registrada em {alerta['data_analise']}")
        st.markdown("**Medidas preventivas:**")
        for medida in alerta["medidas"]:
            st.markdown(f"- {medida}")


def tela_alertas():
    st.title("🚨 Alertas e o que fazer")
    mostrar_origem_dos_dados()

    if not alertas_lista:
        st.info("Não há alertas para os filtros selecionados.")
        return

    for alerta in alertas_lista:
        mostrar_alerta(alerta, alerta["nivel"] in ("ALTO", "CRITICO"))


# ============================================================
# 6. TELA 4 - MINHA REGIAO (fluxo completo do cidadao)
# ============================================================

def tela_minha_regiao():
    st.title("📍 Minha região")
    st.markdown(
        "Escolha onde você está para ver o risco, o motivo e o que fazer."
    )
    mostrar_origem_dos_dados()

    todos = dados.painel_para_alertas(df_painel)
    if not todos:
        st.info("Não há análises de risco disponíveis.")
        return

    por_regiao = {a["regiao"]: a for a in todos}
    escolhida = st.selectbox("Região", sorted(por_regiao))
    alerta = por_regiao[escolhida]
    linha = df_painel[df_painel["NOME_REGIAO"] == escolhida].iloc[0]

    st.subheader(
        f"{ICONES_NIVEL[alerta['nivel']]} {escolhida}: risco {alerta['nivel']}"
    )

    c1, c2, c3 = st.columns(3)
    c1.metric("Pontuação de risco", f"{alerta['pontuacao']:.0f}/100")
    c2.metric("Chuva", f"{linha['CHUVA_PREVISTA']:.1f} mm")
    c3.metric("Ocorrências no histórico", int(linha["TOTAL_OCORRENCIAS"]))

    mostrar_alerta(alerta, True)


# ============================================================
# 7. TELA 5 - SENSORES (IoT)
# ============================================================

def tela_sensores():
    st.title("📡 Sensores de chuva e vento")

    df_sensores, fonte_sensores, aviso_sensores = carregar_sensores_cache()

    if aviso_sensores:
        st.warning(aviso_sensores)

    if fonte_sensores == "SIMULADO":
        st.caption("Leituras SIMULADAS. Não há sensores físicos conectados.")

    col1, col2 = st.columns(2)

    with col1:
        st.plotly_chart(
            px.line(
                df_sensores,
                x="DATA_REGISTRO",
                y="PRECIPITACAO_MM",
                color="NOME_REGIAO",
                title="Sensor de chuva (mm por hora)",
                labels={
                    "DATA_REGISTRO": "Data e hora",
                    "PRECIPITACAO_MM": "Chuva (mm)",
                    "NOME_REGIAO": "Região"
                }
            ),
            use_container_width=True
        )

    with col2:
        st.plotly_chart(
            px.line(
                df_sensores,
                x="DATA_REGISTRO",
                y="VELOCIDADE_VENTO",
                color="NOME_REGIAO",
                title="Sensor de vento (km/h)",
                labels={
                    "DATA_REGISTRO": "Data e hora",
                    "VELOCIDADE_VENTO": "Vento (km/h)",
                    "NOME_REGIAO": "Região"
                }
            ),
            use_container_width=True
        )


# ============================================================
# 8. NAVEGACAO
# ============================================================

{
    TELAS[0]: tela_visao_geral,
    TELAS[1]: tela_mapa,
    TELAS[2]: tela_alertas,
    TELAS[3]: tela_minha_regiao,
    TELAS[4]: tela_sensores,
}[tela]()


# ============================================================
# 9. INFORMACOES DO PROJETO
# ============================================================

st.divider()

st.caption(
    "AlertaClima - Projeto acadêmico FIAP Global Solution 2026/2 (CitizenTech)."
)

st.caption(
    "A pontuação de risco é experimental e não representa um alerta "
    "oficial de órgãos meteorológicos ou de defesa civil."
)
