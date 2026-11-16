"""
AlertaClima - DevOps / Seguranca
Autenticacao simples por senha para o MVP.

- A senha nunca fica no codigo nem no Git: so o HASH (PBKDF2-SHA256 com sal)
  vai na variavel de ambiente APP_SENHA_HASH.
- Sem hash configurado, o app NAO abre (falha fechada). Para desenvolvimento
  local sem senha, defina APP_AUTH=off de forma explicita.
- Gerar o hash:  python -m app.seguranca
"""

import getpass
import hashlib
import hmac
import os
import secrets
import time

ITERACOES = 200_000
MAX_TENTATIVAS = 5
BLOQUEIO_SEGUNDOS = 30


def hash_senha(senha, sal=None, iteracoes=ITERACOES):
    sal = sal or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", senha.encode("utf-8"), sal, iteracoes)
    return f"pbkdf2_sha256${iteracoes}${sal.hex()}${digest.hex()}"


def verificar_senha(senha, armazenado):
    """Compara em tempo constante. Hash malformado nunca autentica."""
    try:
        algoritmo, iteracoes, sal_hex, digest_hex = armazenado.split("$")
        if algoritmo != "pbkdf2_sha256":
            return False
        esperado = bytes.fromhex(digest_hex)
        calculado = hashlib.pbkdf2_hmac(
            "sha256", senha.encode("utf-8"), bytes.fromhex(sal_hex), int(iteracoes)
        )
    except (ValueError, AttributeError):
        return False
    return hmac.compare_digest(calculado, esperado)


def modo_auth():
    """'desligada' | 'senha' | 'nao_configurada' (fecha o app)."""
    if os.getenv("APP_AUTH", "").lower() == "off":
        return "desligada"
    if os.getenv("APP_SENHA_HASH"):
        return "senha"
    return "nao_configurada"


def exigir_login(st):
    """Bloqueia a tela ate o login. Chamar no inicio do app."""
    modo = modo_auth()

    if modo == "desligada":
        st.sidebar.warning("Autenticação desligada (APP_AUTH=off). Use só localmente.")
        return

    if modo == "nao_configurada":
        st.error(
            "Acesso bloqueado: defina APP_SENHA_HASH no ambiente "
            "(veja o README, seção Segurança)."
        )
        st.stop()

    if st.session_state.get("autenticado"):
        return

    agora = time.time()
    bloqueado_ate = st.session_state.get("bloqueado_ate", 0)
    if agora < bloqueado_ate:
        st.error(f"Muitas tentativas. Aguarde {int(bloqueado_ate - agora) + 1}s.")
        st.stop()

    st.title("🔒 AlertaClima")
    senha = st.text_input("Senha de acesso", type="password")

    if st.button("Entrar"):
        if verificar_senha(senha, os.getenv("APP_SENHA_HASH", "")):
            st.session_state["autenticado"] = True
            st.session_state["tentativas"] = 0
            st.rerun()
        else:
            tentativas = st.session_state.get("tentativas", 0) + 1
            st.session_state["tentativas"] = tentativas
            if tentativas >= MAX_TENTATIVAS:
                st.session_state["bloqueado_ate"] = time.time() + BLOQUEIO_SEGUNDOS
                st.session_state["tentativas"] = 0
            st.error("Senha incorreta.")
    st.stop()


if __name__ == "__main__":
    print("Gerador de hash para APP_SENHA_HASH")
    print(hash_senha(getpass.getpass("Nova senha: ")))
