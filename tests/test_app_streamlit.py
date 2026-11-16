"""Smoke test do MVP rodando de verdade (sem Oracle, sem navegador)."""
import pathlib

import pytest
from streamlit.testing.v1 import AppTest

from app import seguranca

MAIN = str(pathlib.Path(__file__).resolve().parent.parent / "app" / "main.py")


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


def test_app_renderiza_com_auth_desligada(monkeypatch):
    monkeypatch.setenv("APP_AUTH", "off")
    at = AppTest.from_file(MAIN, default_timeout=60).run()
    assert not at.exception
    assert len(at.metric) == 4
    assert any("SIMULADOS" in i.value for i in at.info)
    assert len(at.expander) == 5  # um alerta por região
