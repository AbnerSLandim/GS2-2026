"""
AlertaClima - Streaming de sensores ao vivo (IoT)

Simula leituras chegando em tempo real: a cada "tick" cada regiao recebe uma
nova leitura de chuva e vento, o grafico cresce, o feed mostra as ultimas
leituras e o risco de cada regiao e recalculado com a mesma formula do
Big Data. Dados SIMULADOS.
"""

import random
import time
from datetime import datetime, timedelta

import pandas as pd
import plotly.express as px

from app import alertas
from app.dados import OCORRENCIAS_DEMO
from iot.simulador_sensores import PERFIS

CORES_NIVEL = {
    "BAIXO": "#2e9e5b",
    "MODERADO": "#e0b400",
    "ALTO": "#e8741c",
    "CRITICO": "#c8281e",
}

# Em cada tick, uma "frente de chuva" aumenta a intensidade gradualmente
# para a demonstracao mostrar o risco subindo ao vivo.
JANELA_HORAS = 24


# ============================================================
# 1. LOGICA (testavel, sem Streamlit)
# ============================================================

def nova_leitura(regiao, momento, tick, aleatorio):
    chuva_base, vento_base = PERFIS[regiao]
    frente = 1 + 0.06 * tick  # a chuva aperta ao longo da demonstracao
    chuva = max(0.0, aleatorio.gauss(chuva_base * frente, chuva_base * 0.35))
    vento = max(0.0, aleatorio.gauss(vento_base * (1 + 0.02 * tick), vento_base * 0.2))
    return {
        "DATA_REGISTRO": momento,
        "NOME_REGIAO": regiao,
        "PRECIPITACAO_MM": round(chuva, 2),
        "VELOCIDADE_VENTO": round(vento, 1),
    }


def risco_por_regiao(leituras):
    """Recalcula o risco com as ultimas 24 leituras (24 h) de cada regiao."""
    linhas = []
    for regiao, grupo in leituras.groupby("NOME_REGIAO"):
        janela = grupo.tail(JANELA_HORAS)
        chuva = float(janela["PRECIPITACAO_MM"].sum())
        vento = float(janela["VELOCIDADE_VENTO"].max())
        historico = alertas.pontos_historicos(OCORRENCIAS_DEMO.get(regiao, []))
        pontuacao = alertas.pontuar(chuva, vento, historico)
        linhas.append({
            "NOME_REGIAO": regiao,
            "CHUVA_24H": round(chuva, 1),
            "VENTO_MAX": round(vento, 0),
            "PONTUACAO_RISCO": pontuacao,
            "NIVEL_RISCO": alertas.calcular_nivel_risco(pontuacao),
        })
    return pd.DataFrame(linhas).sort_values("PONTUACAO_RISCO", ascending=False)


def historico_inicial(semente=7, horas=12):
    """Algumas horas ja recebidas antes do streaming comecar."""
    aleatorio = random.Random(semente)
    agora = datetime.now().replace(second=0, microsecond=0)
    linhas = []
    for h in range(horas, 0, -1):
        for regiao in PERFIS:
            linhas.append(nova_leitura(regiao, agora - timedelta(hours=h), 0, aleatorio))
    return pd.DataFrame(linhas), aleatorio, agora


# ============================================================
# 2. TELA
# ============================================================

CSS = """
<style>
.av-cabecalho { display:flex; align-items:center; gap:10px; margin:2px 0 10px; }
.av-pulso { width:12px; height:12px; border-radius:50%; background:#e5484d;
  box-shadow:0 0 0 0 rgba(229,72,77,.7); animation:av-p 1.4s infinite; }
@keyframes av-p { 0%{box-shadow:0 0 0 0 rgba(229,72,77,.7)} 70%{box-shadow:0 0 0 12px rgba(229,72,77,0)}
  100%{box-shadow:0 0 0 0 rgba(229,72,77,0)} }
.av-ao-vivo { color:#ff8b85; font-weight:800; letter-spacing:.12em; font-size:.85rem; }
.av-chips { display:flex; gap:10px; flex-wrap:wrap; margin:4px 0 6px; }
.av-chip { flex:1; min-width:150px; border-radius:12px; padding:10px 14px; color:#fff;
  background:#1c1d24; border:1px solid #33343d; }
.av-chip b { display:block; font-size:1.02rem; }
.av-chip span { font-size:.82rem; color:#c9c9d3; }
.av-nivel { display:inline-block; margin-top:6px; padding:2px 10px; border-radius:999px;
  font-size:.78rem; font-weight:800; letter-spacing:.05em; color:#fff; }
.av-feed { font-family: ui-monospace, Consolas, monospace; font-size:.86rem; line-height:1.55;
  background:#15161b; border:1px solid #2c2d35; border-radius:10px; padding:10px 12px; }
.av-feed .novo { color:#7ee2a8; }
</style>
"""


def _chips(risco):
    blocos = []
    for _, r in risco.iterrows():
        cor = CORES_NIVEL[r["NIVEL_RISCO"]]
        blocos.append(
            f'<div class="av-chip" style="border-left:5px solid {cor}">'
            f'<b>{r["NOME_REGIAO"]}</b>'
            f'<span>{r["CHUVA_24H"]:.1f} mm · vento {r["VENTO_MAX"]:.0f} km/h</span><br>'
            f'<span class="av-nivel" style="background:{cor}">{r["NIVEL_RISCO"]} · '
            f'{r["PONTUACAO_RISCO"]:.0f}</span></div>'
        )
    return '<div class="av-chips">' + "".join(blocos) + "</div>"


def _feed(ultimas):
    linhas = []
    for i, (_, r) in enumerate(ultimas.iloc[::-1].iterrows()):
        classe = "novo" if i < len(PERFIS) else ""
        linhas.append(
            f'<div class="{classe}">{r["DATA_REGISTRO"]:%H:%M} · {r["NOME_REGIAO"]:<12} '
            f'chuva {r["PRECIPITACAO_MM"]:5.2f} mm · vento {r["VELOCIDADE_VENTO"]:5.1f} km/h</div>'
        )
    return '<div class="av-feed">' + "".join(linhas) + "</div>"


def executar(st, segundos=22, intervalo=0.8):
    """Roda o streaming por `segundos`. Cada tick = 1 hora simulada."""
    st.markdown(CSS, unsafe_allow_html=True)
    st.markdown(
        '<div class="av-cabecalho"><div class="av-pulso"></div>'
        '<div class="av-ao-vivo">AO VIVO · SENSORES DE CHUVA E VENTO (SIMULADOS)</div></div>',
        unsafe_allow_html=True,
    )

    leituras, aleatorio, agora = historico_inicial()
    m1, m2, m3 = st.columns(3)
    met_total, met_hora, met_alerta = m1.empty(), m2.empty(), m3.empty()
    chips = st.empty()
    col_graf, col_feed = st.columns([3, 2])
    grafico = col_graf.empty()
    feed = col_feed.empty()

    ticks = max(1, int(segundos / intervalo))
    for tick in range(ticks):
        momento = agora + timedelta(hours=tick)
        novas = [nova_leitura(r, momento, tick, aleatorio) for r in PERFIS]
        leituras = pd.concat([leituras, pd.DataFrame(novas)], ignore_index=True)
        risco = risco_por_regiao(leituras)

        met_total.metric("Leituras recebidas", f"{len(leituras)}", f"+{len(novas)}")
        met_hora.metric("Última leitura", f"{momento:%H:%M}")
        em_alerta = int(risco["NIVEL_RISCO"].isin(["ALTO", "CRITICO"]).sum())
        met_alerta.metric("Regiões em alerta", em_alerta)
        chips.markdown(_chips(risco), unsafe_allow_html=True)

        recorte = leituras[leituras["DATA_REGISTRO"] >= momento - timedelta(hours=JANELA_HORAS)]
        fig = px.line(
            recorte, x="DATA_REGISTRO", y="PRECIPITACAO_MM", color="NOME_REGIAO",
            labels={"DATA_REGISTRO": "", "PRECIPITACAO_MM": "Chuva (mm/h)", "NOME_REGIAO": "Região"},
            height=330,
        )
        fig.update_layout(margin={"l": 10, "r": 10, "t": 10, "b": 10},
                          legend={"orientation": "h", "y": -0.18})
        grafico.plotly_chart(fig, use_container_width=True, key=f"av-graf-{tick}")
        feed.markdown(_feed(leituras.tail(10)), unsafe_allow_html=True)
        time.sleep(intervalo)
