import json

import pytest
from fastapi.testclient import TestClient

from api import main as api
from app.seguranca import hash_senha

SENHA = "senha-de-teste"


@pytest.fixture(autouse=True)
def ambiente(monkeypatch):
    for v in ("DB_USER", "DB_PASSWORD", "DB_DSN", "APP_AUTH"):
        monkeypatch.delenv(v, raising=False)
    monkeypatch.setenv("APP_SENHA_HASH", hash_senha(SENHA, iteracoes=1000))
    monkeypatch.setenv("APP_SECRET", "segredo-de-teste")
    api._falhas.clear()
    yield
    api._falhas.clear()


@pytest.fixture
def cliente():
    return TestClient(api.app)


def entrar(cliente):
    r = cliente.post("/api/login", json={"senha": SENHA})
    assert r.status_code == 200
    return r


def test_saude(cliente):
    r = cliente.get("/api/saude")
    assert r.status_code == 200
    assert r.json() == {"status": "ok", "fonte": "SIMULADO"}


def test_regioes_publicas_e_ordenadas(cliente):
    r = cliente.get("/api/regioes")
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["fonte"] == "SIMULADO" and corpo["atualizado_em"]
    regioes = corpo["regioes"]
    assert len(regioes) == 5
    chaves = {"nome", "lat", "lon", "nivel", "pontuacao", "chuva_mm", "vento_kmh",
              "ocorrencias", "data_analise", "alerta"}
    for reg in regioes:
        assert set(reg) == chaves
        assert set(reg["alerta"]) == {"motivo", "medidas"} and reg["alerta"]["medidas"]
    ordem = ["BAIXO", "MODERADO", "ALTO", "CRITICO"]
    chave = [(-ordem.index(x["nivel"]), -x["pontuacao"]) for x in regioes]
    assert chave == sorted(chave)


def test_painel_sem_login_401(cliente):
    assert cliente.get("/api/painel").status_code == 401
    assert cliente.get("/api/sensores").status_code == 401
    assert cliente.get("/api/stream").status_code == 401
    assert cliente.get("/api/me").json() == {"autenticado": False, "auth_configurada": True}


def test_login_certo_libera_painel(cliente):
    r = entrar(cliente)
    cookie = r.headers["set-cookie"].lower()
    assert "httponly" in cookie and "samesite=strict" in cookie
    p = cliente.get("/api/painel")
    assert p.status_code == 200
    ind = p.json()["indicadores"]
    assert ind["regioes"] == 5
    assert set(ind) == {"regioes", "em_alerta", "chuva_max_mm", "vento_max_kmh", "ocorrencias"}
    assert cliente.get("/api/me").json()["autenticado"] is True
    s = cliente.get("/api/sensores").json()
    assert s["leituras"] and set(s["leituras"][0]) == {"data", "regiao", "chuva_mm", "vento_kmh"}
    assert cliente.post("/api/logout").status_code == 200
    assert cliente.get("/api/me").json()["autenticado"] is False


def test_login_errado_401(cliente):
    r = cliente.post("/api/login", json={"senha": "errada"})
    assert r.status_code == 401 and r.json() == {"erro": "Senha incorreta."}


def test_cinco_erros_bloqueiam_por_ip(cliente):
    for _ in range(5):
        assert cliente.post("/api/login", json={"senha": "x"}).status_code == 401
    r = cliente.post("/api/login", json={"senha": SENHA})
    assert r.status_code == 429 and r.json()["tentar_em_s"] >= 1


def test_cookie_forjado_ou_expirado_e_recusado(cliente):
    cliente.cookies.set(api.COOKIE, "abc.def")
    assert cliente.get("/api/painel").status_code == 401
    assert not api.token_valido(api.criar_token(agora=0))


def test_sem_hash_falha_fechada_503(cliente, monkeypatch):
    monkeypatch.delenv("APP_SENHA_HASH")
    assert cliente.post("/api/login", json={"senha": SENHA}).status_code == 503
    r = cliente.get("/api/painel")
    assert r.status_code == 503 and r.json() == {"erro": "Acesso não configurado."}
    assert cliente.get("/api/regioes").status_code == 200
    assert cliente.get("/api/saude").status_code == 200
    assert cliente.get("/api/me").json() == {"autenticado": False, "auth_configurada": False}


def test_auth_off_libera(cliente, monkeypatch):
    monkeypatch.delenv("APP_SENHA_HASH")
    monkeypatch.setenv("APP_AUTH", "off")
    assert cliente.get("/api/painel").status_code == 200
    assert cliente.get("/api/me").json()["autenticado"] is True


def test_stream_entrega_evento_leituras(cliente):
    entrar(cliente)
    with cliente.stream("GET", "/api/stream") as r:
        assert r.status_code == 200
        assert r.headers["content-type"].startswith("text/event-stream")
        bloco = ""
        for linha in r.iter_lines():
            if linha == "":
                break
            bloco += linha + "\n"
    assert bloco.startswith("event: leituras\n")
    dados = json.loads(bloco.split("data: ", 1)[1])
    assert dados["tick"] == 1 and len(dados["novas"]) == 5 and len(dados["risco"]) == 5
    assert dados["total"] > 5
    assert set(dados["risco"][0]) == {"nome", "nivel", "pontuacao", "chuva_24h_mm", "vento_max_kmh"}


def test_cabecalhos_de_seguranca(cliente):
    for rota in ("/api/saude", "/api/painel", "/"):
        r = cliente.get(rota)
        assert r.headers["x-content-type-options"] == "nosniff"
        assert r.headers["x-frame-options"] == "DENY"
        assert r.headers["referrer-policy"] == "strict-origin-when-cross-origin"


def test_rota_api_inexistente_404_json(cliente):
    r = cliente.get("/api/nao-existe")
    assert r.status_code == 404 and "erro" in r.json()


def test_indicadores_sem_login_401(cliente):
    assert cliente.get("/api/indicadores").status_code == 401


def test_indicadores_logado_contrato(cliente):
    entrar(cliente)
    r = cliente.get("/api/indicadores")
    assert r.status_code == 200
    c = r.json()
    assert c["fonte"] == "SIMULADO"
    assert set(c) == {"fonte", "ranking", "evolucao", "previsao", "ocorrencias"}
    assert len(c["ranking"]) == 5
    pontos = [x["pontuacao"] for x in c["ranking"]]
    assert pontos == sorted(pontos, reverse=True)
    assert set(c["ranking"][0]) == {"nome", "pontuacao", "nivel"}
    assert len(c["evolucao"]) == 5 * 7
    assert set(c["evolucao"][0]) == {"data", "regiao", "pontuacao", "variacao", "tendencia"}
    validas = {"PRIMEIRA ANALISE", "RISCO AUMENTOU", "RISCO DIMINUIU", "RISCO ESTAVEL"}
    for e in c["evolucao"]:
        assert e["tendencia"] in validas
        assert (e["variacao"] is None) == (e["tendencia"] == "PRIMEIRA ANALISE")
        if e["variacao"] is not None:
            assert (e["variacao"] > 0) == (e["tendencia"] == "RISCO AUMENTOU")
    assert len(c["previsao"]) == 5 * 48
    assert set(c["previsao"][0]) == {"data", "regiao", "chuva_mm", "temperatura", "umidade", "vento_kmh"}
    assert set(c["ocorrencias"][0]) == {"regiao", "gravidade", "total"}
    assert sum(o["total"] for o in c["ocorrencias"]) == 14
