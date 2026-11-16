"""Smoke test do MVP rodando de verdade (sem Oracle, sem navegador)."""
import pathlib

import pytest
from streamlit.testing.v1 import AppTest

from app import seguranca

MAIN = str(pathlib.Path(__file__).resolve().parent.parent / "app" / "main.py")

TELAS = [
    "🏠 Visão geral",
    "🗺️ Mapa de riscos",
    "🚨 Alertas",
    "📍 Minha região",
    "📡 Sensores",
]


@pytest.fixture(autouse=True)
def sem_oracle(monkeypatch):
    for v in ("DB_USER", "DB_PASSWORD", "DB_DSN", "APP_AUTH", "APP_SENHA_HASH"):
        monkeypatch.delenv(v, raising=False)


def test_sem_configuracao_o_app_fica_bloqueado():
    at = AppTest.from_file(MAIN, default_timeout=60).run()
    assert not at.exception
    assert any("Acesso bloqueado" in e.value for e in at.error)
    assert len(at.metric) == 0  # nenhum dado vazou


def test_login_errado_e_certo(monkeypatch):
    monkeypatch.setenv("APP_SENHA_HASH", seguranca.hash_senha("certa", iteracoes=1000))
    at = AppTest.from_file(MAIN, default_timeout=60).run()
    assert len(at.metric) == 0  # tela de login, sem dados

    at.text_input[0].set_value("errada")
    at.button[0].click().run()
    assert any("incorreta" in e.value for e in at.error)
    assert len(at.metric) == 0

    at.text_input[0].set_value("certa")
    at.button[0].click().run()
    assert not at.exception
    assert len(at.metric) == 4  # painel liberado


def test_bloqueio_apos_tentativas_erradas(monkeypatch):
    monkeypatch.setenv("APP_SENHA_HASH", seguranca.hash_senha("certa", iteracoes=1000))
    at = AppTest.from_file(MAIN, default_timeout=60).run()
    for _ in range(seguranca.MAX_TENTATIVAS):
        at.text_input[0].set_value("errada")
        at.button[0].click().run()

    # Mesmo com a senha certa, fica bloqueado durante a janela.
    at.run()
    assert any("Muitas tentativas" in e.value for e in at.error)


def test_cinco_telas_funcionam(monkeypatch):
    """Rubrica da area 3: 4+ telas funcionais."""
    monkeypatch.setenv("APP_AUTH", "off")
    at = AppTest.from_file(MAIN, default_timeout=60).run()
    assert not at.exception
    assert list(at.sidebar.radio[0].options) == TELAS

    for tela in TELAS:
        at.sidebar.radio[0].set_value(tela).run()
        assert not at.exception, tela
        assert any("SIMULADOS" in i.value for i in at.info) or tela == TELAS[4], tela


def test_conteudo_de_cada_tela(monkeypatch):
    monkeypatch.setenv("APP_AUTH", "off")
    at = AppTest.from_file(MAIN, default_timeout=60).run()
    assert len(at.metric) == 4

    at.sidebar.radio[0].set_value(TELAS[2]).run()
    assert len(at.expander) == 5  # um alerta por regiao

    at.sidebar.radio[0].set_value(TELAS[3]).run()
    assert len(at.metric) == 3
    assert any("Motivo" in m.value for m in at.markdown)  # fluxo completo


def test_fluxo_minha_regiao_muda_com_a_escolha(monkeypatch):
    """Fluxo funcional: escolher regiao -> ver risco, motivo e medidas."""
    monkeypatch.setenv("APP_AUTH", "off")
    at = AppTest.from_file(MAIN, default_timeout=60).run()
    at.sidebar.radio[0].set_value(TELAS[3]).run()

    at.selectbox[0].set_value("Butanta").run()
    assert any("Butanta" in s.value for s in at.subheader)
    at.selectbox[0].set_value("Centro").run()
    assert any("Centro" in s.value for s in at.subheader)
