# Arquitetura — AlertaClima

Rascunho inicial. Atualizar conforme o grupo fechar as partes.

```text
Open-Meteo API ──> ingestao_climatica.py ──> Oracle (DADOS_CLIMATICOS)
                                                   │
Ocorrências históricas (OCORRENCIAS) ──────────────┤
                                                   ▼
                             processamento/calcular_risco.py
                                                   │
                                                   ▼
                                       Oracle (ANALISE_RISCO)
                                                   │
                         ┌─────────────────────────┴───────────┐
                         ▼                                     ▼
                  dashboard.py (Streamlit)            app/ (MVP web — a definir)
```

## Pendências de arquitetura
- IA: onde entra a classificação de risco e a explicação do alerta.
- MVP web: como consome ANALISE_RISCO (API ou leitura direta).
- IoT / experiência digital: o que vira sensor ou entrada de dados.
- Monitoramento e qualidade: logs da ingestão, testes e CI (ver `.github/workflows/ci.yml`).
