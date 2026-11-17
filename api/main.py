"""
AlertaClima - API (FastAPI)

Expoe a logica ja testada de app/ (dados, alertas, ao_vivo, seguranca) para o
front React e serve o build do front (web/dist). Veja docs/PLANO_FRONT_REACT.md.

Rodar:  python -m uvicorn api.main:app --port 8000
"""

import asyncio
import base64
import hashlib
import hmac
import json
import math
import os
import pathlib
import secrets
import threading
import time
from datetime import datetime, timedelta

import pandas as pd
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from pydantic import BaseModel

load_dotenv()

from app import alertas, ao_vivo  # noqa: E402
from app.dados import (  # noqa: E402
    carregar_painel,
    carregar_sensores,
    painel_para_alertas,
)
from app.indicadores import carregar_indicadores  # noqa: E402
from app.seguranca import (  # noqa: E402
    BLOQUEIO_SEGUNDOS,
    MAX_TENTATIVAS,
    modo_auth,
    verificar_senha,
)
from iot.simulador_sensores import PERFIS  # noqa: E402

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DIST = RAIZ / "web" / "dist"

COOKIE = "alertaclima_sessao"
SESSAO_SEGUNDOS = 8 * 60 * 60
STREAM_INTERVALO_S = 0.8
STREAM_MAX_S = 10 * 60

# Segredo aleatorio por processo, usado se APP_SECRET nao estiver definido
# (as sessoes caem a cada reinicio, o que e aceitavel no MVP).
_SEGREDO_PROCESSO = secrets.token_bytes(32)

app = FastAPI(title="AlertaClima API", docs_url=None, redoc_url=None, openapi_url=None)


# ============================================================
# Cabecalhos de seguranca
# ============================================================

@app.middleware("http")
async def cabecalhos_de_seguranca(request: Request, call_next):
    resposta = await call_next(request)
    resposta.headers["X-Content-Type-Options"] = "nosniff"
    resposta.headers["X-Frame-Options"] = "DENY"
    resposta.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return resposta


# ============================================================
# Sessao (cookie assinado com HMAC-SHA256)
# ============================================================

def _segredo():
    segredo = os.getenv("APP_SECRET")
    return segredo.encode("utf-8") if segredo else _SEGREDO_PROCESSO


def _assinar(texto):
    return hmac.new(_segredo(), texto.encode("ascii"), hashlib.sha256).hexdigest()


def criar_token(agora=None):
    expira = int((time.time() if agora is None else agora) + SESSAO_SEGUNDOS)
    carga = base64.urlsafe_b64encode(str(expira).encode()).decode().rstrip("=")
    return f"{carga}.{_assinar(carga)}"


def token_valido(token, agora=None):
    try:
        carga, assinatura = token.split(".")
        if not hmac.compare_digest(_assinar(carga), assinatura):
            return False
        expira = int(base64.urlsafe_b64decode(carga + "=" * (-len(carga) % 4)))
    except (ValueError, AttributeError, UnicodeEncodeError):
        return False
    return (time.time() if agora is None else agora) < expira


def _erro(status, mensagem, **extra):
    return JSONResponse({"erro": mensagem, **extra}, status_code=status)


def exigir_sessao(request: Request):
    """Dependencia das rotas logadas. Devolve None se liberado, ou a resposta de erro."""
    modo = modo_auth()
    if modo == "desligada":
        return None
    if modo == "nao_configurada":
        return _erro(503, "Acesso não configurado.")
    if token_valido(request.cookies.get(COOKIE, "")):
        return None
    return _erro(401, "Não autenticado.")


# ============================================================
# Bloqueio por IP (5 erros -> 30 s)
# ============================================================

_falhas = {}  # ip -> {"erros": int, "ate": float}
_trava = threading.Lock()


def _ip(request):
    return request.client.host if request.client else "desconhecido"


def _segundos_bloqueado(ip, agora):
    with _trava:
        estado = _falhas.get(ip)
        if estado and estado["ate"] > agora:
            return math.ceil(estado["ate"] - agora)
        if estado and estado["ate"]:  # bloqueio expirou
            del _falhas[ip]
    return 0


def _registrar_erro(ip, agora):
    with _trava:
        estado = _falhas.setdefault(ip, {"erros": 0, "ate": 0.0})
        estado["erros"] += 1
        if estado["erros"] >= MAX_TENTATIVAS:
            estado["erros"] = 0
            estado["ate"] = agora + BLOQUEIO_SEGUNDOS


def _limpar_erros(ip):
    with _trava:
        _falhas.pop(ip, None)


# ============================================================
# Serializacao
# ============================================================

def _num(valor, casas=None):
    if valor is None or pd.isna(valor):
        return None
    valor = float(valor)
    return round(valor, casas) if casas is not None else valor


def _iso(valor):
    if valor is None or pd.isna(valor):
        return None
    if isinstance(valor, (datetime, pd.Timestamp)):
        return valor.isoformat()
    return str(valor)


def _agora_iso():
    return datetime.now().replace(microsecond=0).isoformat()


def _regioes(df):
    """Contrato Regiao, ordenado do mais grave (regioes sem analise ficam de fora)."""
    por_nome = {a["regiao"]: a for a in painel_para_alertas(df)}
    lista = []
    for _, l in df.iterrows():
        alerta = por_nome.get(l["NOME_REGIAO"])
        if alerta is None:
            continue
        lista.append({
            "nome": l["NOME_REGIAO"],
            "lat": _num(l["LATITUDE"]),
            "lon": _num(l["LONGITUDE"]),
            "nivel": alerta["nivel"],
            "pontuacao": alerta["pontuacao"],
            "chuva_mm": _num(l["CHUVA_PREVISTA"], 1),
            "vento_kmh": _num(l["VENTO_MAXIMO"], 1),
            "ocorrencias": int(l["TOTAL_OCORRENCIAS"]),
            "data_analise": _iso(alerta["data_analise"]),
            "alerta": {"motivo": alerta["motivo"], "medidas": alerta["medidas"]},
        })
    lista.sort(key=lambda r: (-alertas.ORDEM_NIVEIS.index(r["nivel"]), -r["pontuacao"]))
    return lista


def _leitura(linha):
    return {
        "data": _iso(linha["DATA_REGISTRO"]),
        "regiao": linha["NOME_REGIAO"],
        "chuva_mm": _num(linha["PRECIPITACAO_MM"], 2),
        "vento_kmh": _num(linha["VELOCIDADE_VENTO"], 1),
    }


# ============================================================
# Rotas publicas
# ============================================================

@app.get("/api/saude")
def saude():
    _, fonte, _ = carregar_painel()
    return {"status": "ok", "fonte": fonte}


@app.get("/api/regioes")
def regioes():
    df, fonte, _ = carregar_painel()
    return {"fonte": fonte, "atualizado_em": _agora_iso(), "regioes": _regioes(df)}


class Login(BaseModel):
    senha: str


@app.post("/api/login")
def login(corpo: Login, request: Request):
    modo = modo_auth()
    if modo == "nao_configurada":
        return _erro(503, "Acesso não configurado.")
    if modo == "desligada":
        return {"ok": True}

    ip, agora = _ip(request), time.time()
    restante = _segundos_bloqueado(ip, agora)
    if restante:
        return _erro(429, "Muitas tentativas. Tente novamente em instantes.", tentar_em_s=restante)

    if not verificar_senha(corpo.senha, os.getenv("APP_SENHA_HASH", "")):
        _registrar_erro(ip, agora)
        return _erro(401, "Senha incorreta.")

    _limpar_erros(ip)
    resposta = JSONResponse({"ok": True})
    resposta.set_cookie(
        COOKIE, criar_token(agora), max_age=SESSAO_SEGUNDOS,
        httponly=True, samesite="strict", path="/",
        secure=os.getenv("APP_COOKIE_SECURE", "").lower() in ("1", "true", "on"),
    )
    return resposta


@app.get("/api/me")
def me(request: Request):
    modo = modo_auth()
    autenticado = modo == "desligada" or (
        modo == "senha" and token_valido(request.cookies.get(COOKIE, ""))
    )
    return {"autenticado": autenticado, "auth_configurada": modo != "nao_configurada"}


# ============================================================
# Rotas logadas
# ============================================================

@app.post("/api/logout")
def logout(bloqueio=Depends(exigir_sessao)):
    if bloqueio is not None:
        return bloqueio
    resposta = JSONResponse({"ok": True})
    resposta.delete_cookie(COOKIE, path="/", httponly=True, samesite="strict")
    return resposta


@app.get("/api/painel")
def painel(bloqueio=Depends(exigir_sessao)):
    if bloqueio is not None:
        return bloqueio
    df, fonte, _ = carregar_painel()
    lista = _regioes(df)
    return {
        "fonte": fonte,
        "atualizado_em": _agora_iso(),
        "indicadores": {
            "regioes": len(lista),
            "em_alerta": sum(r["nivel"] in ("ALTO", "CRITICO") for r in lista),
            "chuva_max_mm": max((r["chuva_mm"] or 0 for r in lista), default=0),
            "vento_max_kmh": max((r["vento_kmh"] or 0 for r in lista), default=0),
            "ocorrencias": sum(r["ocorrencias"] for r in lista),
        },
        "regioes": lista,
    }


@app.get("/api/sensores")
def sensores(bloqueio=Depends(exigir_sessao)):
    if bloqueio is not None:
        return bloqueio
    df, fonte, _ = carregar_sensores()
    leituras = [_leitura(l) for _, l in df.sort_values("DATA_REGISTRO").iterrows()]
    return {"fonte": fonte, "leituras": leituras}


@app.get("/api/indicadores")
def indicadores(bloqueio=Depends(exigir_sessao)):
    if bloqueio is not None:
        return bloqueio
    corpo, _ = carregar_indicadores()
    return corpo


def _evento_leituras(tick, momento, total, novas, risco):
    dados = {
        "tick": tick,
        "momento": momento.isoformat(),
        "total": total,
        "novas": [_leitura(pd.Series(n)) for n in novas],
        "risco": [
            {
                "nome": r["NOME_REGIAO"],
                "nivel": r["NIVEL_RISCO"],
                "pontuacao": _num(r["PONTUACAO_RISCO"], 1),
                "chuva_24h_mm": _num(r["CHUVA_24H"], 1),
                "vento_max_kmh": _num(r["VENTO_MAX"], 0),
            }
            for _, r in risco.iterrows()
        ],
    }
    return f"event: leituras\ndata: {json.dumps(dados, ensure_ascii=False)}\n\n"


async def _fluxo(request):
    leituras, aleatorio, agora = ao_vivo.historico_inicial()
    total = len(leituras)
    inicio = time.monotonic()
    tick = 0
    while time.monotonic() - inicio < STREAM_MAX_S:
        if await request.is_disconnected():
            return
        tick += 1
        momento = agora + timedelta(hours=tick)
        novas = [ao_vivo.nova_leitura(r, momento, tick, aleatorio) for r in PERFIS]
        leituras = pd.concat([leituras, pd.DataFrame(novas)], ignore_index=True)
        leituras = leituras.groupby("NOME_REGIAO", sort=False).tail(ao_vivo.JANELA_HORAS * 2)
        total += len(novas)
        risco = ao_vivo.risco_por_regiao(leituras)
        yield _evento_leituras(tick, momento, total, novas, risco)
        await asyncio.sleep(STREAM_INTERVALO_S)


@app.get("/api/stream")
async def stream(request: Request):
    bloqueio = exigir_sessao(request)
    if bloqueio is not None:
        return bloqueio
    return StreamingResponse(
        _fluxo(request),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ============================================================
# Front (SPA) - build em web/dist, avaliado a cada requisicao
# ============================================================

@app.get("/{caminho:path}", include_in_schema=False)
def front(caminho: str):
    if caminho == "api" or caminho.startswith("api/"):
        return _erro(404, "Rota não encontrada.")
    indice = DIST / "index.html"
    if not indice.is_file():
        if caminho:
            return _erro(404, "Rota não encontrada.")
        return JSONResponse({"mensagem": "Front não buildado. Rode: npm --prefix web run build"})
    if caminho:
        alvo = (DIST / caminho).resolve()
        if alvo.is_file() and DIST.resolve() in alvo.parents:
            return FileResponse(alvo)
    return FileResponse(indice)
