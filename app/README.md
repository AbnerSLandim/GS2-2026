# app/ — MVP web do AlertaClima (experiência digital)

Painel Streamlit que mostra o risco climático por região, o **motivo** de cada
alerta e as **medidas preventivas**, com mapa e sensores de chuva e vento.

Segue o padrão do módulo de Big Data: Python, Streamlit, Plotly,
`python-oracledb`, `.env` e as mesmas tabelas Oracle.

## Como rodar

```bash
pip install -r requirements.txt
python -m app.seguranca            # gera o hash da senha; cole em APP_SENHA_HASH no .env
streamlit run app/main.py
```

Sem Oracle configurado, o app usa dados **simulados** e avisa na tela.
Para desenvolvimento local sem senha: `APP_AUTH=off` no `.env`.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `main.py` | Telas: indicadores, mapa, alertas, sensores |
| `dados.py` | Lê Oracle (`REGIOES`, `DADOS_CLIMATICOS`, `OCORRENCIAS`, `ANALISE_RISCO`) ou usa simulação |
| `alertas.py` | Alerta com motivo e medidas; reaproveita a pontuação de `processamento/calcular_risco.py` |
| `seguranca.py` | Login por senha (PBKDF2), bloqueio por tentativas, falha fechada |
| `../iot/simulador_sensores.py` | Sensores simulados de chuva e vento (`TIPO_DADO = 'SENSOR'`) |

## Segurança

- A senha nunca vai para o Git: só o hash, em `APP_SENHA_HASH`.
- Sem `APP_SENHA_HASH` (e sem `APP_AUTH=off`), o app **não abre**.
- 5 tentativas erradas bloqueiam o login por 30 s (por sessão).
- O `.env` está no `.gitignore` e no `.dockerignore`.

## Uso de IA generativa (declaração exigida pelo edital)

- **Claude Code (Anthropic)** foi usado para escrever e revisar o código de `app/`, `iot/` e `tests/`, os documentos em `docs/` e para auditar o resultado.
- O código foi revisado e executado (`python -m pytest tests -v`) pelo integrante responsável antes da entrega.
- Dados de exemplo e leituras de sensor são sintéticos.

## Limites conhecidos

- Os sensores são **simulados**; não há hardware conectado.
- Os alertas são baseados em regras. A geração de texto por IA é da área de IA.
- A pontuação é experimental e não substitui alertas oficiais da Defesa Civil.
- Não testado contra um Oracle real (sem banco nesta máquina).
