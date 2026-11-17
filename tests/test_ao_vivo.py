import random
from datetime import datetime

import pandas as pd

from app import ao_vivo
from iot.simulador_sensores import PERFIS


def test_leitura_nova_e_valida():
    r = ao_vivo.nova_leitura("Centro", datetime(2026, 11, 16, 12), 3, random.Random(1))
    assert r["NOME_REGIAO"] == "Centro"
    assert r["PRECIPITACAO_MM"] >= 0 and r["VELOCIDADE_VENTO"] >= 0


def test_risco_recalculado_para_todas_as_regioes():
    leituras, _, _ = ao_vivo.historico_inicial(horas=6)
    risco = ao_vivo.risco_por_regiao(leituras)
    assert set(risco["NOME_REGIAO"]) == set(PERFIS)
    assert set(risco["NIVEL_RISCO"]) <= {"BAIXO", "MODERADO", "ALTO", "CRITICO"}
    assert list(risco["PONTUACAO_RISCO"]) == sorted(risco["PONTUACAO_RISCO"], reverse=True)


def test_frente_de_chuva_aumenta_o_risco():
    """Mais leituras com a frente de chuva -> pontuacao nao cai."""
    leituras, aleatorio, agora = ao_vivo.historico_inicial(horas=6)
    antes = ao_vivo.risco_por_regiao(leituras).set_index("NOME_REGIAO")["PONTUACAO_RISCO"]
    novas = [ao_vivo.nova_leitura(r, agora, 20, aleatorio) for r in PERFIS for _ in range(6)]
    depois = ao_vivo.risco_por_regiao(
        pd.concat([leituras, pd.DataFrame(novas)], ignore_index=True)
    ).set_index("NOME_REGIAO")["PONTUACAO_RISCO"]
    assert (depois >= antes).all()
