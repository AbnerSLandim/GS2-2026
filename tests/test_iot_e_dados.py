from datetime import datetime

from app import dados
from iot import simulador_sensores as sim


def test_simulador_e_deterministico_e_valido():
    fim = datetime(2026, 11, 16, 12)
    a = sim.gerar_leituras(quantidade=6, semente=1, fim=fim)
    b = sim.gerar_leituras(quantidade=6, semente=1, fim=fim)
    assert a == b
    assert len(a) == 6 * len(sim.PERFIS)
    assert all(l["TIPO_DADO"] == "SENSOR" for l in a)
    assert all(l["PRECIPITACAO_MM"] >= 0 and l["VELOCIDADE_VENTO"] >= 0 for l in a)
    assert all(0 <= l["UMIDADE"] <= 100 for l in a)


def test_painel_simulado_tem_regras_do_big_data(monkeypatch):
    for v in ("DB_USER", "DB_PASSWORD", "DB_DSN"):
        monkeypatch.delenv(v, raising=False)
    df, fonte, aviso = dados.carregar_painel()
    assert fonte == "SIMULADO" and aviso is None
    assert list(df.columns) == dados.COLUNAS_PAINEL
    assert set(df["NIVEL_RISCO"]) <= {"BAIXO", "MODERADO", "ALTO", "CRITICO"}
    assert len(df) == 5


def test_alertas_do_painel_vem_ordenados(monkeypatch):
    for v in ("DB_USER", "DB_PASSWORD", "DB_DSN"):
        monkeypatch.delenv(v, raising=False)
    df, _, _ = dados.carregar_painel()
    lista = dados.painel_para_alertas(df)
    assert len(lista) == 5
    ordem = ["BAIXO", "MODERADO", "ALTO", "CRITICO"]
    niveis = [ordem.index(a["nivel"]) for a in lista]
    assert niveis == sorted(niveis, reverse=True)


def test_oracle_indisponivel_cai_no_simulado_com_aviso(monkeypatch):
    monkeypatch.setenv("DB_USER", "x")
    monkeypatch.setenv("DB_PASSWORD", "x")
    monkeypatch.setenv("DB_DSN", "invalido:1/x")
    monkeypatch.setattr(dados, "_consultar", lambda *a, **k: (_ for _ in ()).throw(RuntimeError("falhou")))
    df, fonte, aviso = dados.carregar_painel()
    assert fonte == "SIMULADO" and "indisponível" in aviso
    assert "falhou" not in aviso  # o detalhe do erro nao vai para a tela
