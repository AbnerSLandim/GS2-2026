from app import alertas


def test_pontuar_usa_mesma_formula_do_big_data():
    # chuva 20 mm -> 75 pts; vento 50 km/h -> 50 pts; historico 40
    # 75*0.5 + 50*0.2 + 40*0.3 = 37.5 + 10 + 12 = 59.5
    assert alertas.pontuar(20, 50, 40) == 59.5


def test_historico_limitado_a_100():
    assert alertas.pontos_historicos(["CRITICA"] * 10) == 100.0
    assert alertas.pontos_historicos(["BAIXA", "ALTA"]) == 25.0
    assert alertas.pontos_historicos(["DESCONHECIDA"]) == 0.0


def test_alerta_critico_tem_motivo_e_medidas():
    alerta = alertas.montar_alerta("Butantã", 35, 85, 90)
    assert alerta["nivel"] == "CRITICO"
    assert "chuva" in alerta["motivo"] and "vento" in alerta["motivo"]
    assert any("199" in m for m in alerta["medidas"])


def test_alerta_baixo_nao_alarma():
    alerta = alertas.montar_alerta("Centro", 0.5, 10, 5)
    assert alerta["nivel"] == "BAIXO"
    assert "elevado" not in alerta["motivo"]


def test_ordenar_do_mais_grave_ao_menos_grave():
    lista = [
        alertas.montar_alerta("A", 0, 0, 10),
        alertas.montar_alerta("B", 40, 90, 95),
        alertas.montar_alerta("C", 10, 30, 55),
    ]
    assert [a["regiao"] for a in alertas.ordenar_alertas(lista)] == ["B", "C", "A"]
