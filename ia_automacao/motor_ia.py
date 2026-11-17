import json
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from typing import Dict, Any

HISTORICO_REGIOES = {
    "Vila Itaim": {
        "eventos_passados": 5,
        "declividade_encosta": 0.15,
        "limiar_critico_chuva_mm": 40.0,
        "historico_resumo": "Bairro em área de várzea com 5 enchentes severas registradas quando a chuva passa de 40mm/h."
    },
    "Vila Alpina": {
        "eventos_passados": 3,
        "declividade_encosta": 0.65,
        "limiar_critico_chuva_mm": 50.0,
        "historico_resumo": "Região com vias de alta declividade; histórico de enxurradas e queda de árvores com ventos fortes."
    },
    "Franco da Rocha (Encosta)": {
        "eventos_passados": 6,
        "declividade_encosta": 0.90,
        "limiar_critico_chuva_mm": 35.0,
        "historico_resumo": "Solo instável com histórico de deslizamentos de terra após chuvas acumuladas acima de 35mm/h."
    },
    "Centro Histórico": {
        "eventos_passados": 4,
        "declividade_encosta": 0.25,
        "limiar_critico_chuva_mm": 45.0,
        "historico_resumo": "Alta retenção térmica (ilha de calor) e pontos de alagamento recorrentes em vias principais."
    }
}

class ClassificadorRiscoClimatico:
    def __init__(self):
        self.modelo = RandomForestClassifier(n_estimators=100, random_state=42)
        self.labels = {0: "BAIXO", 1: "MODERADO", 2: "ALTO", 3: "CRÍTICO"}
        self._treinar_modelo_base()

    def _treinar_modelo_base(self):
        np.random.seed(42)
        X, y = [], []
        for _ in range(600):
            chuva = np.random.uniform(0, 90)
            vento = np.random.uniform(5, 100)
            temp = np.random.uniform(14, 43)
            hist = np.random.randint(0, 7)
            decliv = np.random.uniform(0.1, 1.0)
            calor = np.random.uniform(0.2, 1.0)

            score = 0
            if chuva > 50 or (chuva > 35 and hist >= 4):
                score += 2
            elif chuva > 20:
                score += 1
            if vento > 65 or (chuva > 30 and decliv > 0.7):
                score += 2
            elif vento > 40:
                score += 1
            if temp >= 37 and calor > 0.75:
                score += 2

            classe = min(3, max(0, score))
            X.append([chuva, vento, temp, hist, decliv, calor])
            y.append(classe)

        self.modelo.fit(np.array(X), np.array(y))

    def prever(self, chuva_mm: float, vento_kmh: float, temp_c: float, dados_regiao: dict) -> dict:
        features = np.array([[chuva_mm, vento_kmh, temp_c, dados_regiao["eventos_passados"], dados_regiao["declividade_encosta"], 0.5]])
        classe_idx = int(self.modelo.predict(features)[0])
        probabilidades = self.modelo.predict_proba(features)[0]
        return {
            "nivel_risco": self.labels[classe_idx],
            "confianca_ia_pct": round(float(np.max(probabilidades)) * 100, 1)
        }

def acionar_agente_e_automacao(regiao: str, chuva_mm_h: float, vento_km_h: float, temperatura_c: float = 26.0) -> Dict[str, Any]:
    contexto = HISTORICO_REGIOES.get(regiao, {
        "eventos_passados": 2, "declividade_encosta": 0.3, "limiar_critico_chuva_mm": 45.0, "historico_resumo": "Monitoramento preventivo ativo."
    })
    predicao = motor_ml.prever(chuva_mm_h, vento_km_h, temperatura_c, contexto)
    nivel = predicao["nivel_risco"]

    ameacas = []
    if chuva_mm_h >= contexto["limiar_critico_chuva_mm"]: ameacas.append("Enchente / Alagamento")
    if chuva_mm_h >= 30 and contexto["declividade_encosta"] >= 0.65: ameacas.append("Deslizamento de Encosta")
    if vento_km_h >= 55: ameacas.append("Vendaval e Queda de Árvores")
    if not ameacas: ameacas.append("Estável" if nivel == "BAIXO" else "Atenção Meteorológica")

    motivo = f"Sensores registraram {chuva_mm_h}mm/h de chuva e ventos de {vento_km_h}km/h. Motivo do risco: {contexto['historico_resumo']}"
    acoes = [
        f"Evite as vias de maior risco em {regiao} e proteja bens essenciais.",
        "Acompanhe as atualizações em tempo real pelo painel da Defesa Civil.",
        "Em caso de emergência, ligue para a Defesa Civil (199)."
    ]

    return {
        "regiao": regiao,
        "ia_predicao": {"nivel_risco": nivel, "confianca_modelo_pct": predicao["confianca_ia_pct"], "ameacas": ameacas},
        "agente_explicavel": {"motivo": motivo, "o_que_fazer": acoes},
        "automacao": {"alerta_disparado": nivel in ["ALTO", "CRÍTICO"]}
    }

motor_ml = ClassificadorRiscoClimatico()