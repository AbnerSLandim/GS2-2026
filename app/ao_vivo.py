"""
AlertaClima - Streaming de sensores ao vivo (IoT)

Simula leituras chegando em tempo real: a cada "tick" cada regiao recebe uma
nova leitura de chuva e vento, o grafico cresce, o feed mostra as ultimas
leituras e o risco de cada regiao e recalculado com a mesma formula do
Big Data. Dados SIMULADOS.
"""

import random
from datetime import datetime, timedelta

import pandas as pd

from app import alertas
from app.dados import OCORRENCIAS_DEMO
from iot.simulador_sensores import PERFIS

CORES_NIVEL = {
    "BAIXO": "#2e9e5b",
    "MODERADO": "#e0b400",
    "ALTO": "#e8741c",
    "CRITICO": "#c8281e",
}

# Em cada tick, uma "frente de chuva" aumenta a intensidade gradualmente
# para a demonstracao mostrar o risco subindo ao vivo.
JANELA_HORAS = 24


# ============================================================
# LOGICA (testavel)
# ============================================================

def nova_leitura(regiao, momento, tick, aleatorio):
    chuva_base, vento_base = PERFIS[regiao]
    frente = 1 + 0.06 * tick  # a chuva aperta ao longo da demonstracao
    chuva = max(0.0, aleatorio.gauss(chuva_base * frente, chuva_base * 0.35))
    vento = max(0.0, aleatorio.gauss(vento_base * (1 + 0.02 * tick), vento_base * 0.2))
    return {
        "DATA_REGISTRO": momento,
        "NOME_REGIAO": regiao,
        "PRECIPITACAO_MM": round(chuva, 2),
        "VELOCIDADE_VENTO": round(vento, 1),
    }


def risco_por_regiao(leituras):
    """Recalcula o risco com as ultimas 24 leituras (24 h) de cada regiao."""
    linhas = []
    for regiao, grupo in leituras.groupby("NOME_REGIAO"):
        janela = grupo.tail(JANELA_HORAS)
        chuva = float(janela["PRECIPITACAO_MM"].sum())
        vento = float(janela["VELOCIDADE_VENTO"].max())
        historico = alertas.pontos_historicos(OCORRENCIAS_DEMO.get(regiao, []))
        pontuacao = alertas.pontuar(chuva, vento, historico)
        linhas.append({
            "NOME_REGIAO": regiao,
            "CHUVA_24H": round(chuva, 1),
            "VENTO_MAX": round(vento, 0),
            "PONTUACAO_RISCO": pontuacao,
            "NIVEL_RISCO": alertas.calcular_nivel_risco(pontuacao),
        })
    return pd.DataFrame(linhas).sort_values("PONTUACAO_RISCO", ascending=False)


def historico_inicial(semente=7, horas=12):
    """Algumas horas ja recebidas antes do streaming comecar."""
    aleatorio = random.Random(semente)
    agora = datetime.now().replace(second=0, microsecond=0)
    linhas = []
    for h in range(horas, 0, -1):
        for regiao in PERFIS:
            linhas.append(nova_leitura(regiao, agora - timedelta(hours=h), 0, aleatorio))
    return pd.DataFrame(linhas), aleatorio, agora
