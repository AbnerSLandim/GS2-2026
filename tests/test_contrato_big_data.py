"""Garante que o MVP continua alinhado com o modulo de Big Data da Joy."""
import pathlib
import re

from app import alertas, dados
from iot import simulador_sensores as sim

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def test_regioes_do_mvp_batem_com_o_seed_do_oracle():
    sql = (RAIZ / "sql" / "02_dados_iniciais.sql").read_text(encoding="utf-8")
    seed = {
        nome: (float(lat), float(lon))
        for nome, lat, lon in re.findall(
            r"VALUES \('([^']+)', '[^']+', '[A-Z]{2}', (-?[\d.]+), (-?[\d.]+)\)", sql
        )
    }
    assert seed, "seed de REGIOES nao encontrado"
    assert dados.REGIOES_DEMO == seed
    assert set(sim.PERFIS) == set(seed)
    assert set(dados.OCORRENCIAS_DEMO) == set(seed)


def test_pesos_duplicados_batem_com_calcular_risco():
    fonte = (RAIZ / "processamento" / "calcular_risco.py").read_text(encoding="utf-8")
    assert "pontuacao_chuva * 0.50" in fonte
    assert "pontuacao_vento * 0.20" in fonte
    assert "pontuacao_historica * 0.30" in fonte
    assert (alertas.PESO_CHUVA, alertas.PESO_VENTO, alertas.PESO_HISTORICO) == (0.5, 0.2, 0.3)
    for gravidade, pontos in alertas.PESO_GRAVIDADE.items():
        assert re.search(rf"GRAVIDADE = '{gravidade}' THEN {pontos}\b", fonte), gravidade


def test_painel_simulado_recalculado_de_forma_independente(monkeypatch):
    for v in ("DB_USER", "DB_PASSWORD", "DB_DSN"):
        monkeypatch.delenv(v, raising=False)
    from processamento import calcular_risco as cr

    df = dados.painel_simulado()
    for _, linha in df.iterrows():
        historico = min(
            sum({"BAIXA": 5, "MEDIA": 10, "ALTA": 20, "CRITICA": 30}[g]
                for g in dados.OCORRENCIAS_DEMO[linha["NOME_REGIAO"]]),
            100,
        )
        esperado = round(
            cr.calcular_pontuacao_chuva(linha["CHUVA_PREVISTA"]) * 0.50
            + cr.calcular_pontuacao_vento(linha["VENTO_MAXIMO"]) * 0.20
            + historico * 0.30,
            2,
        )
        assert linha["PONTUACAO_RISCO"] == esperado
        assert linha["NIVEL_RISCO"] == cr.calcular_nivel_risco(esperado)
        assert linha["TOTAL_OCORRENCIAS"] == len(dados.OCORRENCIAS_DEMO[linha["NOME_REGIAO"]])


def test_motivo_do_alerta_considera_o_historico():
    alerta = alertas.montar_alerta("X", 0.5, 10, 30, ocorrencias=5)
    assert "5 ocorrências" in alerta["motivo"]
    assert alerta["ocorrencias"] == 5


def test_gitignore_protege_env():
    linhas = (RAIZ / ".gitignore").read_text(encoding="utf-8").splitlines()
    assert ".env" in linhas
    assert "!.env" not in linhas


def test_gravar_falha_alto_se_regiao_nao_cadastrada(monkeypatch):
    """Antes, leituras de regiao inexistente eram descartadas em silencio."""
    import types

    class Cursor:
        def execute(self, *a, **k): pass
        def fetchall(self): return [("Centro", 1)]  # so Centro cadastrado
        def executemany(self, *a, **k): raise AssertionError("nao deveria inserir")

    class Conexao:
        def cursor(self): return Cursor()
        def rollback(self): pass
        def close(self): pass

    fake = types.SimpleNamespace(connect=lambda **k: Conexao())
    monkeypatch.setitem(__import__("sys").modules, "oracledb", fake)
    monkeypatch.setenv("DB_USER", "u")
    monkeypatch.setenv("DB_PASSWORD", "p")
    monkeypatch.setenv("DB_DSN", "d")
    try:
        sim.gravar_no_oracle(sim.gerar_leituras(quantidade=1))
    except ValueError as erro:
        assert "Butanta" in str(erro)
    else:
        raise AssertionError("deveria ter falhado")
