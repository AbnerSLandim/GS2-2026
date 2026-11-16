# Arquitetura — AlertaClima

Rascunho do diagrama geral (rubrica da área 3). Falta a versão final em imagem para o PDF.

```text
                          CIDADÃO
                             │  (login)
                             ▼
              ┌──────────────────────────────┐
              │  MVP web (app/main.py)       │  ← MVP, IoT e experiência digital
              │  5 telas: visão geral, mapa, │
              │  alertas, minha região,      │
              │  sensores                    │
              └──────▲───────────────▲───────┘
                     │               │
        alertas com motivo       leituras de sensor
        e medidas (app/alertas)  (iot/simulador_sensores.py)
                     │               │  TIPO_DADO = 'SENSOR'
                     │               ▼
Open-Meteo ─► ingestao_climatica.py ─► Oracle ◄──────────────┐
 (previsão)                           │ REGIOES              │
                                      │ DADOS_CLIMATICOS     │
Ocorrências históricas ───────────────► OCORRENCIAS          │
                                      │ ANALISE_RISCO        │
                                      ▼                      │
                     processamento/calcular_risco.py ────────┘
                                      │
                                      ▼
                       dashboard.py (Streamlit)  ← Big Data e visualização

IA e automação: a definir pela área responsável (classificação e texto dos alertas).
DevOps: Docker + GitHub Actions (CI) + testes + autenticação (login com hash PBKDF2).
```

## O que está ligado hoje e o que não está

| Ligação | Estado |
|---|---|
| Ingestão → Oracle → cálculo de risco → dashboard (Joy) | existe no código da Joy; **não executado por nós** |
| MVP lê as mesmas tabelas Oracle | implementado, **não testado contra Oracle real** |
| Sensores → Oracle (`--gravar`) | implementado, **não testado contra Oracle real** |
| Sensores alimentam o cálculo de risco | **não**. O cálculo usa só `TIPO_DADO = 'PREVISAO'` |
| IA gera ou classifica alertas | **não integrado**. Os alertas do MVP são por regras |

Integrar sensores e IA ao fluxo é diferencial do edital ("áreas integradas") e não está pronto.
