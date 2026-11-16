from app import seguranca


def test_hash_e_verificacao():
    armazenado = seguranca.hash_senha("senha-de-teste", iteracoes=1000)
    assert seguranca.verificar_senha("senha-de-teste", armazenado)
    assert not seguranca.verificar_senha("outra", armazenado)


def test_hash_tem_sal_aleatorio():
    assert seguranca.hash_senha("x", iteracoes=1000) != seguranca.hash_senha("x", iteracoes=1000)


def test_hash_malformado_nunca_autentica():
    for lixo in ["", "abc", "md5$1$aa$bb", "pbkdf2_sha256$x$zz$yy", None]:
        assert not seguranca.verificar_senha("qualquer", lixo)


def test_falha_fechada_sem_configuracao(monkeypatch):
    monkeypatch.delenv("APP_SENHA_HASH", raising=False)
    monkeypatch.delenv("APP_AUTH", raising=False)
    assert seguranca.modo_auth() == "nao_configurada"


def test_modos(monkeypatch):
    monkeypatch.setenv("APP_SENHA_HASH", "x")
    monkeypatch.delenv("APP_AUTH", raising=False)
    assert seguranca.modo_auth() == "senha"
    monkeypatch.setenv("APP_AUTH", "off")
    assert seguranca.modo_auth() == "desligada"
