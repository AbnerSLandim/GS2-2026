"""
AlertaClima - MVP / Experiencia digital
Camada de dados do MVP.

- Com Oracle configurado (.env): le REGIOES, DADOS_CLIMATICOS, OCORRENCIAS e
  ANALISE_RISCO, as mesmas tabelas do modulo de Big Data.
- Sem Oracle: usa dados SIMULADOS, sempre identificados como tal.
"""

import logging
import os

import pandas as pd

from app import alertas
from iot.simulador_sensores import gerar_leituras

# Nomes e coordenadas IGUAIS aos de sql/02_dados_iniciais.sql (modulo Big Data).
# Com Oracle, vale LATITUDE/LONGITUDE da tabela REGIOES.
REGIOES_DEMO = {
    "Centro": (-23.5505, -46.6333),
    "Mooca": (-23.5500, -46.6000),
    "Ipiranga": (-23.5850, -46.6100),
    "Vila Mariana": (-23.5890, -46.6340),
    "Butanta": (-23.5700, -46.7200),
}

# Ocorrencias historicas ILUSTRATIVAS do modo simulado (nao sao dados reais).
OCORRENCIAS_DEMO = {
    "Centro": ["MEDIA", "ALTA"],
    "Mooca": ["ALTA", "ALTA", "CRITICA"],
    "Ipiranga": ["ALTA", "CRITICA", "CRITICA"],
    "Vila Mariana": ["BAIXA", "MEDIA"],
    "Butanta": ["CRITICA", "CRITICA", "ALTA", "ALTA"],
}

COLUNAS_PAINEL = [
    "NOME_REGIAO", "LATITUDE", "LONGITUDE", "CHUVA_PREVISTA",
    "VENTO_MAXIMO", "TOTAL_OCORRENCIAS", "PONTUACAO_RISCO", "NIVEL_RISCO",
    "DATA_ANALISE",
]

logger = logging.getLogger(__name__)

AVISO_ORACLE = (
    "Oracle indisponível: mostrando dados simulados. "
    "Detalhes no log do servidor."
)


def oracle_configurado():
    return all(os.getenv(v) for v in ("DB_USER", "DB_PASSWORD", "DB_DSN"))


def _conectar():
    import oracledb

    return oracledb.connect(
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        dsn=os.getenv("DB_DSN"),
    )


def _consultar(sql, parametros=None):
    conexao = _conectar()
    try:
        cursor = conexao.cursor()
        cursor.execute(sql, parametros or {})
        colunas = [c[0] for c in cursor.description]
        return pd.DataFrame(cursor.fetchall(), columns=colunas)
    finally:
        conexao.close()


SQL_PAINEL = """
WITH CLIMA AS (
    SELECT ID_REGIAO,
           SUM(PRECIPITACAO_MM) AS CHUVA_PREVISTA,
           MAX(VELOCIDADE_VENTO) AS VENTO_MAXIMO
    FROM DADOS_CLIMATICOS
    WHERE TIPO_DADO = 'PREVISAO'
      AND DATA_PREVISAO >= CURRENT_TIMESTAMP
      AND DATA_PREVISAO < CURRENT_TIMESTAMP + NUMTODSINTERVAL(:horas, 'HOUR')
    GROUP BY ID_REGIAO
),
HISTORICO AS (
    SELECT ID_REGIAO, COUNT(*) AS TOTAL_OCORRENCIAS
    FROM OCORRENCIAS
    GROUP BY ID_REGIAO
),
ULTIMA_ANALISE AS (
    SELECT ID_REGIAO, PONTUACAO_RISCO, NIVEL_RISCO, DATA_ANALISE
    FROM (
        SELECT ID_REGIAO, PONTUACAO_RISCO, NIVEL_RISCO, DATA_ANALISE,
               ROW_NUMBER() OVER (
                   PARTITION BY ID_REGIAO
                   ORDER BY DATA_ANALISE DESC, ID_ANALISE DESC
               ) AS RN
        FROM ANALISE_RISCO
    )
    WHERE RN = 1
)
SELECT R.NOME_REGIAO, R.LATITUDE, R.LONGITUDE,
       NVL(C.CHUVA_PREVISTA, 0) AS CHUVA_PREVISTA,
       NVL(C.VENTO_MAXIMO, 0) AS VENTO_MAXIMO,
       NVL(H.TOTAL_OCORRENCIAS, 0) AS TOTAL_OCORRENCIAS,
       A.PONTUACAO_RISCO, A.NIVEL_RISCO, A.DATA_ANALISE
FROM REGIOES R
LEFT JOIN CLIMA C ON R.ID_REGIAO = C.ID_REGIAO
LEFT JOIN HISTORICO H ON R.ID_REGIAO = H.ID_REGIAO
LEFT JOIN ULTIMA_ANALISE A ON R.ID_REGIAO = A.ID_REGIAO
ORDER BY R.NOME_REGIAO
"""

SQL_SENSORES = """
SELECT R.NOME_REGIAO, C.DATA_REGISTRO, C.PRECIPITACAO_MM,
       C.VELOCIDADE_VENTO, C.TEMPERATURA, C.UMIDADE
FROM DADOS_CLIMATICOS C
JOIN REGIOES R ON C.ID_REGIAO = R.ID_REGIAO
WHERE C.TIPO_DADO = 'SENSOR'
  AND C.DATA_REGISTRO >= CURRENT_TIMESTAMP - INTERVAL '24' HOUR
ORDER BY C.DATA_REGISTRO
"""


def painel_simulado():
    """Painel completo calculado com as mesmas regras do Big Data."""
    sensores = pd.DataFrame(gerar_leituras(list(REGIOES_DEMO)))
    linhas = []
    for regiao, (lat, lon) in REGIOES_DEMO.items():
        s = sensores[sensores["NOME_REGIAO"] == regiao]
        chuva = float(s["PRECIPITACAO_MM"].sum())
        vento = float(s["VELOCIDADE_VENTO"].max())
        ocorrencias = OCORRENCIAS_DEMO[regiao]
        pontuacao = alertas.pontuar(chuva, vento, alertas.pontos_historicos(ocorrencias))
        linhas.append({
            "NOME_REGIAO": regiao,
            "LATITUDE": lat,
            "LONGITUDE": lon,
            "CHUVA_PREVISTA": round(chuva, 2),
            "VENTO_MAXIMO": round(vento, 2),
            "TOTAL_OCORRENCIAS": len(ocorrencias),
            "PONTUACAO_RISCO": pontuacao,
            "NIVEL_RISCO": alertas.calcular_nivel_risco(pontuacao),
            "DATA_ANALISE": None,
        })
    return pd.DataFrame(linhas, columns=COLUNAS_PAINEL)


def sensores_simulados():
    return pd.DataFrame(gerar_leituras(list(REGIOES_DEMO)))


def carregar_painel(horas=24):
    """Devolve (DataFrame, fonte, aviso). fonte = 'ORACLE' ou 'SIMULADO'."""
    if oracle_configurado():
        try:
            df = _consultar(SQL_PAINEL, {"horas": horas})
            for coluna in ("LATITUDE", "LONGITUDE", "CHUVA_PREVISTA",
                           "VENTO_MAXIMO", "PONTUACAO_RISCO"):
                df[coluna] = pd.to_numeric(df[coluna], errors="coerce")
            return df, "ORACLE", None
        except Exception:  # banco fora do ar, tabelas ausentes etc.
            logger.exception("Falha ao ler o painel no Oracle")
            return painel_simulado(), "SIMULADO", AVISO_ORACLE
    return painel_simulado(), "SIMULADO", None


def carregar_sensores():
    """Devolve (DataFrame, fonte, aviso) das leituras de sensor das ultimas 24 h."""
    if oracle_configurado():
        try:
            df = _consultar(SQL_SENSORES)
            if not df.empty:
                df["DATA_REGISTRO"] = pd.to_datetime(df["DATA_REGISTRO"])
                return df, "ORACLE", None
            return sensores_simulados(), "SIMULADO", (
                "Sem leituras de sensor no Oracle; mostrando simulação."
            )
        except Exception:
            logger.exception("Falha ao ler os sensores no Oracle")
            return sensores_simulados(), "SIMULADO", AVISO_ORACLE
    return sensores_simulados(), "SIMULADO", None


def painel_para_alertas(df):
    """Converte o painel em alertas ordenados (so regioes com analise)."""
    lista = []
    for _, linha in df.dropna(subset=["PONTUACAO_RISCO", "NIVEL_RISCO"]).iterrows():
        lista.append(alertas.montar_alerta(
            linha["NOME_REGIAO"],
            float(linha["CHUVA_PREVISTA"]),
            float(linha["VENTO_MAXIMO"]),
            float(linha["PONTUACAO_RISCO"]),
            linha["NIVEL_RISCO"],
            ocorrencias=int(linha["TOTAL_OCORRENCIAS"]),
            data_analise=linha.get("DATA_ANALISE"),
        ))
    return alertas.ordenar_alertas(lista)
