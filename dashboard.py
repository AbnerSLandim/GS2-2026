
import os

import oracledb
import pandas as pd
import plotly.express as px
import streamlit as st
from dotenv import load_dotenv


# ============================================================
# 1. CONFIGURACAO
# ============================================================

load_dotenv()

st.set_page_config(
    page_title="AlertaClima - Dashboard",
    page_icon="🌧️",
    layout="wide"
)

st.title("🌧️ AlertaClima")
st.subheader("Painel de monitoramento climático e análise de risco")

st.markdown(
    "Acompanhe previsões meteorológicas, histórico de ocorrências "
    "e níveis de risco dos bairros monitorados."
)


# ============================================================
# 2. CONEXAO COM ORACLE
# ============================================================

def conectar_banco():
    usuario = os.getenv("DB_USER")
    senha = os.getenv("DB_PASSWORD")
    dsn = os.getenv("DB_DSN")

    if not usuario or not senha or not dsn:
        raise ValueError(
            "Verifique DB_USER, DB_PASSWORD e DB_DSN no arquivo .env."
        )

    return oracledb.connect(
        user=usuario,
        password=senha,
        dsn=dsn
    )


def consultar_banco(sql, parametros=None):
    conexao = None
    cursor = None

    try:
        conexao = conectar_banco()
        cursor = conexao.cursor()

        cursor.execute(sql, parametros or {})

        colunas = [coluna[0] for coluna in cursor.description]
        resultados = cursor.fetchall()

        return pd.DataFrame(resultados, columns=colunas)

    finally:
        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


# ============================================================
# 3. CONSULTA PRINCIPAL - DADOS POR BAIRRO
# ============================================================

SQL_PAINEL = """
WITH CLIMA AS (
    SELECT
        ID_REGIAO,
        COUNT(*) AS HORAS_ANALISADAS,
        SUM(PRECIPITACAO_MM) AS CHUVA_PREVISTA,
        AVG(TEMPERATURA) AS TEMPERATURA_MEDIA,
        AVG(UMIDADE) AS UMIDADE_MEDIA,
        AVG(VELOCIDADE_VENTO) AS VENTO_MEDIO,
        MAX(VELOCIDADE_VENTO) AS VENTO_MAXIMO
    FROM DADOS_CLIMATICOS
    WHERE TIPO_DADO = 'PREVISAO'
      AND DATA_PREVISAO >= CURRENT_TIMESTAMP
      AND DATA_PREVISAO < CURRENT_TIMESTAMP
          + NUMTODSINTERVAL(:horas, 'HOUR')
    GROUP BY ID_REGIAO
),

HISTORICO_OCORRENCIAS AS (
    SELECT
        ID_REGIAO,
        COUNT(*) AS TOTAL_OCORRENCIAS,
        SUM(
            CASE WHEN GRAVIDADE = 'ALTA'
            THEN 1 ELSE 0 END
        ) AS OCORRENCIAS_ALTAS,
        SUM(
            CASE WHEN GRAVIDADE = 'CRITICA'
            THEN 1 ELSE 0 END
        ) AS OCORRENCIAS_CRITICAS
    FROM OCORRENCIAS
    GROUP BY ID_REGIAO
),

ULTIMA_ANALISE AS (
    SELECT
        ID_REGIAO,
        PONTUACAO_RISCO,
        NIVEL_RISCO,
        DATA_ANALISE
    FROM (
        SELECT
            ID_REGIAO,
            PONTUACAO_RISCO,
            NIVEL_RISCO,
            DATA_ANALISE,
            ROW_NUMBER() OVER (
                PARTITION BY ID_REGIAO
                ORDER BY DATA_ANALISE DESC, ID_ANALISE DESC
            ) AS RN
        FROM ANALISE_RISCO
    )
    WHERE RN = 1
)

SELECT
    R.ID_REGIAO,
    R.NOME_REGIAO,
    NVL(C.HORAS_ANALISADAS, 0) AS HORAS_ANALISADAS,
    NVL(C.CHUVA_PREVISTA, 0) AS CHUVA_PREVISTA,
    C.TEMPERATURA_MEDIA,
    C.UMIDADE_MEDIA,
    C.VENTO_MEDIO,
    C.VENTO_MAXIMO,
    NVL(O.TOTAL_OCORRENCIAS, 0) AS TOTAL_OCORRENCIAS,
    NVL(O.OCORRENCIAS_ALTAS, 0) AS OCORRENCIAS_ALTAS,
    NVL(O.OCORRENCIAS_CRITICAS, 0) AS OCORRENCIAS_CRITICAS,
    A.PONTUACAO_RISCO,
    A.NIVEL_RISCO,
    A.DATA_ANALISE
FROM REGIOES R
LEFT JOIN CLIMA C
    ON R.ID_REGIAO = C.ID_REGIAO
LEFT JOIN HISTORICO_OCORRENCIAS O
    ON R.ID_REGIAO = O.ID_REGIAO
LEFT JOIN ULTIMA_ANALISE A
    ON R.ID_REGIAO = A.ID_REGIAO
ORDER BY C.CHUVA_PREVISTA DESC NULLS LAST
"""


# ============================================================
# 4. CONSULTA - PREVISAO HORA A HORA
# ============================================================

SQL_PREVISAO = """
SELECT
    R.NOME_REGIAO,
    C.DATA_PREVISAO,
    C.PRECIPITACAO_MM,
    C.TEMPERATURA,
    C.UMIDADE,
    C.VELOCIDADE_VENTO
FROM DADOS_CLIMATICOS C
JOIN REGIOES R
    ON C.ID_REGIAO = R.ID_REGIAO
WHERE C.TIPO_DADO = 'PREVISAO'
  AND C.DATA_PREVISAO >= CURRENT_TIMESTAMP
  AND C.DATA_PREVISAO < CURRENT_TIMESTAMP
      + NUMTODSINTERVAL(:horas, 'HOUR')
ORDER BY C.DATA_PREVISAO
"""


# ============================================================
# 5. CONSULTA - OCORRENCIAS POR GRAVIDADE
# ============================================================

SQL_OCORRENCIAS = """
SELECT
    R.NOME_REGIAO,
    O.GRAVIDADE,
    COUNT(*) AS TOTAL
FROM OCORRENCIAS O
JOIN REGIOES R
    ON O.ID_REGIAO = R.ID_REGIAO
GROUP BY
    R.NOME_REGIAO,
    O.GRAVIDADE
ORDER BY R.NOME_REGIAO
"""


# ============================================================
# 6. CONSULTA - EVOLUCAO DO RISCO COM LAG()
# Calcula a analise anterior antes de filtrar os ultimos 7 dias.
# ============================================================

SQL_HISTORICO = """
WITH EVOLUCAO AS (
    SELECT
        R.NOME_REGIAO,
        A.DATA_ANALISE,
        A.PONTUACAO_RISCO,
        A.NIVEL_RISCO,

        LAG(A.PONTUACAO_RISCO) OVER (
            PARTITION BY A.ID_REGIAO
            ORDER BY A.DATA_ANALISE, A.ID_ANALISE
        ) AS PONTUACAO_ANTERIOR

    FROM ANALISE_RISCO A
    JOIN REGIOES R
        ON A.ID_REGIAO = R.ID_REGIAO
)
SELECT
    NOME_REGIAO,
    DATA_ANALISE,
    PONTUACAO_ANTERIOR,
    PONTUACAO_RISCO,

    PONTUACAO_RISCO - PONTUACAO_ANTERIOR
        AS VARIACAO_RISCO,

    CASE
        WHEN PONTUACAO_ANTERIOR IS NULL
            THEN 'PRIMEIRA ANALISE'
        WHEN PONTUACAO_RISCO > PONTUACAO_ANTERIOR
            THEN 'RISCO AUMENTOU'
        WHEN PONTUACAO_RISCO < PONTUACAO_ANTERIOR
            THEN 'RISCO DIMINUIU'
        ELSE 'RISCO ESTAVEL'
    END AS TENDENCIA

FROM EVOLUCAO
WHERE DATA_ANALISE >= CURRENT_TIMESTAMP - INTERVAL '7' DAY
ORDER BY DATA_ANALISE
"""


# ============================================================
# 7. CARREGAMENTO DOS DADOS
# ============================================================

st.sidebar.header("Filtros")

horas = st.sidebar.selectbox(
    "Período da previsão",
    options=[24, 48],
    format_func=lambda x: f"Próximas {x} horas"
)

try:
    with st.spinner("Consultando dados do Oracle..."):

        df_painel = consultar_banco(
            SQL_PAINEL,
            {"horas": horas}
        )

        df_previsao = consultar_banco(
            SQL_PREVISAO,
            {"horas": horas}
        )

        df_ocorrencias = consultar_banco(SQL_OCORRENCIAS)

        df_historico = consultar_banco(SQL_HISTORICO)

except Exception as erro:
    st.error("Não foi possível carregar os dados do Oracle.")
    st.exception(erro)
    st.stop()


# ============================================================
# 8. TRATAMENTO DOS DADOS
# ============================================================

colunas_numericas = [
    "CHUVA_PREVISTA",
    "TEMPERATURA_MEDIA",
    "UMIDADE_MEDIA",
    "VENTO_MEDIO",
    "VENTO_MAXIMO",
    "PONTUACAO_RISCO"
]

for coluna in colunas_numericas:
    if coluna in df_painel.columns:
        df_painel[coluna] = pd.to_numeric(
            df_painel[coluna],
            errors="coerce"
        )

if not df_previsao.empty:
    df_previsao["DATA_PREVISAO"] = pd.to_datetime(
        df_previsao["DATA_PREVISAO"]
    )

    for coluna in [
        "PRECIPITACAO_MM",
        "TEMPERATURA",
        "UMIDADE",
        "VELOCIDADE_VENTO"
    ]:
        df_previsao[coluna] = pd.to_numeric(
            df_previsao[coluna],
            errors="coerce"
        )

if not df_historico.empty:
    df_historico["DATA_ANALISE"] = pd.to_datetime(
        df_historico["DATA_ANALISE"]
    )

    for coluna in [
        "PONTUACAO_ANTERIOR",
        "PONTUACAO_RISCO",
        "VARIACAO_RISCO"
    ]:
        df_historico[coluna] = pd.to_numeric(
            df_historico[coluna],
            errors="coerce"
        )


# ============================================================
# 9. FILTROS DE BAIRRO E NIVEL DE RISCO
# ============================================================

bairros_disponiveis = sorted(
    df_painel["NOME_REGIAO"].dropna().unique().tolist()
)

bairros_selecionados = st.sidebar.multiselect(
    "Bairros",
    options=bairros_disponiveis,
    default=bairros_disponiveis
)

niveis_disponiveis = [
    "BAIXO",
    "MODERADO",
    "ALTO",
    "CRITICO"
]

niveis_selecionados = st.sidebar.multiselect(
    "Níveis de risco",
    options=niveis_disponiveis,
    default=niveis_disponiveis
)

df_painel = df_painel[
    df_painel["NOME_REGIAO"].isin(bairros_selecionados)
    & df_painel["NIVEL_RISCO"].isin(niveis_selecionados)
].copy()

bairros_filtrados = df_painel["NOME_REGIAO"].tolist()

df_previsao = df_previsao[
    df_previsao["NOME_REGIAO"].isin(bairros_filtrados)
].copy()

df_ocorrencias = df_ocorrencias[
    df_ocorrencias["NOME_REGIAO"].isin(bairros_filtrados)
].copy()

df_historico = df_historico[
    df_historico["NOME_REGIAO"].isin(bairros_filtrados)
].copy()


# ============================================================
# 10. INDICADORES GERAIS
# ============================================================

st.divider()
st.header("Indicadores gerais")

total_bairros = len(bairros_disponiveis)

bairros_analisados = df_painel[
    df_painel["NIVEL_RISCO"].notna()
]["NOME_REGIAO"].nunique()

total_ocorrencias = int(
    df_painel["TOTAL_OCORRENCIAS"].sum()
)

maior_chuva = (
    df_painel["CHUVA_PREVISTA"].max()
    if not df_painel.empty
    else 0
)

c1, c2, c3, c4 = st.columns(4)

c1.metric("Bairros monitorados", total_bairros)
c2.metric("Bairros analisados", bairros_analisados)
c3.metric("Ocorrências cadastradas", total_ocorrencias)
c4.metric("Maior chuva prevista", f"{maior_chuva:.2f} mm")


# ============================================================
# 11. RANKING DE RISCO
# ============================================================

st.divider()
st.header("🏆 Ranking de risco por bairro")

st.markdown(
    "Classificação dos bairros com base na pontuação da análise "
    "de risco mais recente registrada no banco."
)

df_ranking = df_painel[
    df_painel["PONTUACAO_RISCO"].notna()
].copy()

if not df_ranking.empty:

    df_ranking["RANKING_RISCO"] = (
        df_ranking["PONTUACAO_RISCO"]
        .rank(method="min", ascending=False)
        .astype(int)
    )

    df_ranking = df_ranking.sort_values(
        ["RANKING_RISCO", "NOME_REGIAO"]
    )

    col1, col2 = st.columns([1, 1.5])

    with col1:
        st.subheader("Classificação")

        df_tabela_ranking = df_ranking[
            [
                "RANKING_RISCO",
                "NOME_REGIAO",
                "PONTUACAO_RISCO",
                "NIVEL_RISCO"
            ]
        ].rename(
            columns={
                "RANKING_RISCO": "Posição",
                "NOME_REGIAO": "Bairro",
                "PONTUACAO_RISCO": "Pontuação",
                "NIVEL_RISCO": "Nível de risco"
            }
        )

        st.dataframe(
            df_tabela_ranking,
            use_container_width=True,
            hide_index=True
        )

    with col2:
        fig_ranking = px.bar(
            df_ranking,
            x="PONTUACAO_RISCO",
            y="NOME_REGIAO",
            color="NIVEL_RISCO",
            orientation="h",
            text="PONTUACAO_RISCO",
            title="Pontuação de risco por bairro",
            labels={
                "PONTUACAO_RISCO": "Pontuação de risco",
                "NOME_REGIAO": "Bairro",
                "NIVEL_RISCO": "Nível de risco"
            }
        )

        fig_ranking.update_layout(
            yaxis={"categoryorder": "total ascending"},
            xaxis={"range": [0, 100]}
        )

        st.plotly_chart(
            fig_ranking,
            use_container_width=True
        )

else:
    st.info("Não existem análises de risco para os filtros selecionados.")


# ============================================================
# 12. EVOLUCAO DO RISCO
# ============================================================

st.divider()
st.header("📈 Evolução do risco")

st.markdown(
    "Acompanhe as mudanças na pontuação de risco dos bairros "
    "nos últimos sete dias. A variação compara cada análise "
    "com a análise imediatamente anterior do mesmo bairro."
)

if not df_historico.empty:

    col1, col2 = st.columns(2)

    with col1:
        fig_evolucao = px.line(
            df_historico,
            x="DATA_ANALISE",
            y="PONTUACAO_RISCO",
            color="NOME_REGIAO",
            markers=True,
            title="Histórico da pontuação de risco",
            labels={
                "DATA_ANALISE": "Data da análise",
                "PONTUACAO_RISCO": "Pontuação de risco",
                "NOME_REGIAO": "Bairro"
            }
        )

        fig_evolucao.update_yaxes(range=[0, 100])

        st.plotly_chart(
            fig_evolucao,
            use_container_width=True
        )

    with col2:
        df_variacao = df_historico.dropna(
            subset=["VARIACAO_RISCO"]
        ).copy()

        if not df_variacao.empty:

            df_ultima_variacao = (
                df_variacao.sort_values("DATA_ANALISE")
                .groupby("NOME_REGIAO")
                .tail(1)
                .sort_values("VARIACAO_RISCO")
            )

            fig_variacao = px.bar(
                df_ultima_variacao,
                x="VARIACAO_RISCO",
                y="NOME_REGIAO",
                color="TENDENCIA",
                orientation="h",
                text="VARIACAO_RISCO",
                title="Variação em relação à análise anterior",
                labels={
                    "VARIACAO_RISCO": "Variação de pontos",
                    "NOME_REGIAO": "Bairro",
                    "TENDENCIA": "Tendência"
                }
            )

            st.plotly_chart(
                fig_variacao,
                use_container_width=True
            )

        else:
            st.info(
                "Ainda não existem análises anteriores suficientes "
                "para calcular a variação."
            )

    st.subheader("Detalhamento da evolução")

    df_tabela_evolucao = df_historico[
        [
            "NOME_REGIAO",
            "DATA_ANALISE",
            "PONTUACAO_ANTERIOR",
            "PONTUACAO_RISCO",
            "VARIACAO_RISCO",
            "TENDENCIA"
        ]
    ].sort_values(
        ["NOME_REGIAO", "DATA_ANALISE"],
        ascending=[True, False]
    ).rename(
        columns={
            "NOME_REGIAO": "Bairro",
            "DATA_ANALISE": "Data da análise",
            "PONTUACAO_ANTERIOR": "Pontuação anterior",
            "PONTUACAO_RISCO": "Pontuação atual",
            "VARIACAO_RISCO": "Variação",
            "TENDENCIA": "Tendência"
        }
    )

    st.dataframe(
        df_tabela_evolucao,
        use_container_width=True,
        hide_index=True
    )

else:
    st.info(
        "Não existem análises de risco nos últimos sete dias "
        "para os bairros selecionados."
    )


# ============================================================
# 13. PREVISAO CLIMATICA
# ============================================================

st.divider()
st.header(f"🌦️ Previsão climática - Próximas {horas} horas")

if not df_painel.empty:

    col1, col2 = st.columns(2)

    with col1:
        fig_chuva = px.bar(
            df_painel,
            x="NOME_REGIAO",
            y="CHUVA_PREVISTA",
            title="Precipitação acumulada prevista por bairro",
            labels={
                "NOME_REGIAO": "Bairro",
                "CHUVA_PREVISTA": "Chuva prevista (mm)"
            }
        )

        st.plotly_chart(
            fig_chuva,
            use_container_width=True
        )

    with col2:
        if not df_previsao.empty:

            fig_temperatura = px.line(
                df_previsao,
                x="DATA_PREVISAO",
                y="TEMPERATURA",
                color="NOME_REGIAO",
                title="Temperatura prevista ao longo do tempo",
                labels={
                    "DATA_PREVISAO": "Data e hora",
                    "TEMPERATURA": "Temperatura (°C)",
                    "NOME_REGIAO": "Bairro"
                }
            )

            st.plotly_chart(
                fig_temperatura,
                use_container_width=True
            )

        else:
            st.info("Não há dados de previsão disponíveis.")

else:
    st.info("Nenhum bairro corresponde aos filtros selecionados.")


# ============================================================
# 14. HISTORICO DE OCORRENCIAS
# ============================================================

st.divider()
st.header("📋 Histórico de ocorrências")

if not df_ocorrencias.empty:

    fig_ocorrencias = px.bar(
        df_ocorrencias,
        x="NOME_REGIAO",
        y="TOTAL",
        color="GRAVIDADE",
        barmode="stack",
        title="Ocorrências por bairro e gravidade",
        labels={
            "NOME_REGIAO": "Bairro",
            "TOTAL": "Quantidade",
            "GRAVIDADE": "Gravidade"
        }
    )

    st.plotly_chart(
        fig_ocorrencias,
        use_container_width=True
    )

else:
    st.info(
        "Não há ocorrências cadastradas para os filtros selecionados."
    )


# ============================================================
# 15. TABELA DETALHADA
# ============================================================

st.divider()
st.header("📊 Dados detalhados por bairro")

colunas_exibicao = [
    "NOME_REGIAO",
    "HORAS_ANALISADAS",
    "CHUVA_PREVISTA",
    "TEMPERATURA_MEDIA",
    "UMIDADE_MEDIA",
    "VENTO_MEDIO",
    "VENTO_MAXIMO",
    "TOTAL_OCORRENCIAS",
    "PONTUACAO_RISCO",
    "NIVEL_RISCO"
]

st.dataframe(
    df_painel[colunas_exibicao],
    use_container_width=True,
    hide_index=True
)


# ============================================================
# 16. INFORMACOES DO PROJETO
# ============================================================

st.divider()

st.caption(
    "AlertaClima - Projeto acadêmico FIAP Global Solution 2026/2."
)

st.caption(
    "As ocorrências cadastradas atualmente são dados ilustrativos. "
    "A pontuação de risco é experimental e não representa um alerta "
    "oficial de órgãos meteorológicos ou de defesa civil."
)
