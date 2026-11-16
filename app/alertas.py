"""
AlertaClima - MVP / Experiencia digital
Regras de alerta: transforma a pontuacao de risco em um alerta legivel,
com o MOTIVO e as MEDIDAS PREVENTIVAS.

Reaproveita as funcoes de pontuacao do modulo de Big Data
(processamento/calcular_risco.py) para nao existirem duas regras diferentes.
A geracao de texto por IA e responsabilidade da area de IA; aqui o alerta e
baseado em regras e fica pronto para receber esse texto no futuro.
"""

from processamento.calcular_risco import (
    calcular_nivel_risco,
    calcular_pontuacao_chuva,
    calcular_pontuacao_vento,
)

# Mesmos pesos usados em processamento/calcular_risco.py
PESO_CHUVA = 0.50
PESO_VENTO = 0.20
PESO_HISTORICO = 0.30

PESO_GRAVIDADE = {"BAIXA": 5, "MEDIA": 10, "ALTA": 20, "CRITICA": 30}

ORDEM_NIVEIS = ["BAIXO", "MODERADO", "ALTO", "CRITICO"]

MEDIDAS = {
    "BAIXO": [
        "Nenhuma ação necessária. Acompanhe a previsão do dia.",
    ],
    "MODERADO": [
        "Fique atento à previsão nas próximas horas.",
        "Evite deixar objetos soltos em áreas abertas.",
    ],
    "ALTO": [
        "Evite áreas de alagamento e encostas.",
        "Deixe documentos e itens importantes em local alto.",
        "Prefira transporte seguro e evite atravessar ruas alagadas.",
    ],
    "CRITICO": [
        "Procure um local seguro e elevado imediatamente.",
        "Não atravesse ruas alagadas nem áreas de deslizamento.",
        "Em emergência, ligue 199 (Defesa Civil) ou 193 (Bombeiros).",
    ],
}


def pontos_historicos(gravidades):
    """Converte uma lista de gravidades de ocorrencias em pontos (maximo 100)."""
    total = sum(PESO_GRAVIDADE.get(g, 0) for g in gravidades)
    return float(min(total, 100))


def pontuar(chuva_mm, vento_kmh, historico):
    """Pontuacao final de risco (0-100), mesma formula do Big Data."""
    pontuacao = (
        calcular_pontuacao_chuva(chuva_mm) * PESO_CHUVA
        + calcular_pontuacao_vento(vento_kmh) * PESO_VENTO
        + min(float(historico), 100) * PESO_HISTORICO
    )
    return round(pontuacao, 2)


def montar_alerta(nome_regiao, chuva_mm, vento_kmh, pontuacao, nivel=None):
    """Monta o alerta de uma regiao: nivel, motivo e medidas preventivas."""
    nivel = nivel or calcular_nivel_risco(pontuacao)

    fatores = []
    if calcular_pontuacao_chuva(chuva_mm) >= 50:
        fatores.append(f"chuva prevista de {chuva_mm:.1f} mm")
    if calcular_pontuacao_vento(vento_kmh) >= 50:
        fatores.append(f"vento de até {vento_kmh:.0f} km/h")

    if fatores:
        motivo = "Risco elevado por " + " e ".join(fatores) + "."
    else:
        motivo = (
            f"Chuva prevista de {chuva_mm:.1f} mm e vento de até "
            f"{vento_kmh:.0f} km/h."
        )

    return {
        "regiao": nome_regiao,
        "nivel": nivel,
        "pontuacao": float(pontuacao),
        "motivo": motivo,
        "medidas": list(MEDIDAS[nivel]),
    }


def ordenar_alertas(alertas):
    """Do mais grave para o menos grave."""
    return sorted(
        alertas,
        key=lambda a: (-ORDEM_NIVEIS.index(a["nivel"]), -a["pontuacao"]),
    )
