"""
AlertaClima - Indicadores de Big Data (modulo do Joy)

Consultas SQL copiadas do dashboard.py original (sem importar o arquivo, que
executa Streamlit no import). Com Oracle configurado le o banco; sem Oracle
(ou em erro) gera dados SIMULADOS deterministicos e coerentes.
"""

import logging
import math
import random
from datetime import datetime, timedelta

import pandas as pd

from app.dados import (
    AVISO_ORACLE,
    OCORRENCIAS_DEMO,
    REGIOES_DEMO,
    _consultar,
    carregar_painel,
    oracle_configurado,
)
from iot.simulador_sensores import PERFIS

logger = logging.getLogger(__name__)

HORAS_PREVISAO = 48

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


def tendencia(atual, anterior):
    """Mesma regra do CASE do SQL_HISTORICO."""
    if anterior is None:
        return "PRIMEIRA ANALISE"
    if atual > anterior:
        return "RISCO AUMENTOU"
    if atual < anterior:
        return "RISCO DIMINUIU"
    return "RISCO ESTAVEL"


def _num(v, casas=None):
    if v is None or pd.isna(v):
        return None
    v = float(v)
    return round(v, casas) if casas is not None else v


def _iso(v):
    if v is None or pd.isna(v):
        return None
    return pd.Timestamp(v).to_pydatetime().isoformat()


def _ranking(df):
    lista = [
        {"nome": r["NOME_REGIAO"], "pontuacao": _num(r["PONTUACAO_RISCO"], 2),
         "nivel": r["NIVEL_RISCO"]}
        for _, r in df.dropna(subset=["PONTUACAO_RISCO", "NIVEL_RISCO"]).iterrows()
    ]
    return sorted(lista, key=lambda x: -x["pontuacao"])


# ---------------- simulado ----------------

def _evolucao_simulada(ranking, agora):
    linhas = []
    for item in ranking:
        regiao = item["nome"]
        rng = random.Random(f"evolucao-{regiao}")
        # caminha de tras para frente a partir da pontuacao atual
        pontos = [item["pontuacao"]]
        for _ in range(6):
            pontos.append(min(100.0, max(0.0, round(pontos[-1] + rng.uniform(-8, 8), 2))))
        pontos.reverse()
        anterior = None
        for i, p in enumerate(pontos):
            data = (agora - timedelta(days=6 - i)).replace(
                hour=6, minute=0, second=0, microsecond=0)
            linhas.append({
                "data": data.isoformat(), "regiao": regiao, "pontuacao": p,
                "variacao": None if anterior is None else round(p - anterior, 2),
                "tendencia": tendencia(p, anterior),
            })
            anterior = p
    return sorted(linhas, key=lambda x: (x["data"], x["regiao"]))


def _previsao_simulada(agora):
    inicio = agora.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)
    linhas = []
    for regiao, (chuva_base, vento_base) in PERFIS.items():
        rng = random.Random(f"previsao-{regiao}")
        for h in range(HORAS_PREVISAO):
            momento = inicio + timedelta(hours=h)
            ciclo = math.cos((momento.hour - 15) / 24 * 2 * math.pi)  # pico as 15h
            linhas.append({
                "data": momento.isoformat(), "regiao": regiao,
                "chuva_mm": round(max(0.0, rng.gauss(chuva_base * (1 + 0.5 * ciclo),
                                                     chuva_base * 0.3)), 2),
                "temperatura": round(22 + 4 * ciclo + rng.gauss(0, 0.6), 1),
                "umidade": round(min(100, max(30, 78 - 6 * ciclo + rng.gauss(0, 3))), 1),
                "vento_kmh": round(max(0.0, rng.gauss(vento_base, vento_base * 0.15)), 1),
            })
    return linhas


def _ocorrencias_simuladas():
    linhas = []
    for regiao in REGIOES_DEMO:
        contagem = {}
        for g in OCORRENCIAS_DEMO.get(regiao, []):
            contagem[g] = contagem.get(g, 0) + 1
        for g, total in sorted(contagem.items()):
            linhas.append({"regiao": regiao, "gravidade": g, "total": total})
    return linhas


def _simulado(ranking):
    agora = datetime.now().replace(microsecond=0)
    return {
        "evolucao": _evolucao_simulada(ranking, agora),
        "previsao": _previsao_simulada(agora),
        "ocorrencias": _ocorrencias_simuladas(),
    }


# ---------------- oracle ----------------

def _do_oracle():
    hist = _consultar(SQL_HISTORICO)
    prev = _consultar(SQL_PREVISAO, {"horas": HORAS_PREVISAO})
    ocor = _consultar(SQL_OCORRENCIAS)
    return {
        "evolucao": [
            {"data": _iso(r["DATA_ANALISE"]), "regiao": r["NOME_REGIAO"],
             "pontuacao": _num(r["PONTUACAO_RISCO"], 2),
             "variacao": _num(r["VARIACAO_RISCO"], 2), "tendencia": r["TENDENCIA"]}
            for _, r in hist.iterrows()
        ],
        "previsao": [
            {"data": _iso(r["DATA_PREVISAO"]), "regiao": r["NOME_REGIAO"],
             "chuva_mm": _num(r["PRECIPITACAO_MM"], 2), "temperatura": _num(r["TEMPERATURA"], 1),
             "umidade": _num(r["UMIDADE"], 1), "vento_kmh": _num(r["VELOCIDADE_VENTO"], 1)}
            for _, r in prev.iterrows()
        ],
        "ocorrencias": [
            {"regiao": r["NOME_REGIAO"], "gravidade": r["GRAVIDADE"], "total": int(r["TOTAL"])}
            for _, r in ocor.iterrows()
        ],
    }


def carregar_indicadores():
    """Devolve (dict no contrato /api/indicadores, aviso)."""
    df, fonte, aviso = carregar_painel()
    ranking = _ranking(df)
    if oracle_configurado() and fonte == "ORACLE":
        try:
            return {"fonte": "ORACLE", "ranking": ranking, **_do_oracle()}, None
        except Exception:
            logger.exception("Falha ao ler os indicadores no Oracle")
            aviso = AVISO_ORACLE
    return {"fonte": "SIMULADO", "ranking": ranking, **_simulado(ranking)}, aviso
