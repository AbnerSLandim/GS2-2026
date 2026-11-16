# app/ — MVP web do AlertaClima (experiência digital)

Painel Streamlit que mostra o risco climático por região, o **motivo** de cada
alerta e as **medidas preventivas**, com mapa e sensores de chuva e vento.

Segue o padrão do módulo de Big Data: Python, Streamlit, Plotly,
`python-oracledb`, `.env` e as mesmas tabelas Oracle.

## Requisitos

- **Python 3.11 ou 3.12** (as versões fixadas em `requirements.txt` exigem 3.11+).
- Oracle é **opcional**: sem ele o app roda com dados simulados e avisa na tela.

## Como rodar

```bash
pip install -r requirements.txt
python -m app.seguranca            # pede uma senha e imprime o hash
```

Crie um arquivo `.env` (pode partir do `.env.example`) com **apenas** a linha do hash:

```env
APP_SENHA_HASH=<hash impresso acima>
```

> Não deixe os `DB_*` de exemplo no `.env`: eles ligam a tentativa de conexão
> com o Oracle e o app passa a mostrar "Oracle indisponível". Preencha `DB_USER`,
> `DB_PASSWORD` e `DB_DSN` somente se houver um Oracle de verdade.

```bash
streamlit run app/main.py
```

Entre com a senha escolhida. Para desenvolvimento local sem senha: `APP_AUTH=off`.

## Telas

1. **Visão geral:** indicadores e tabela de regiões com histórico de ocorrências.
2. **Mapa de riscos:** risco por região no mapa.
3. **Alertas:** motivo e medidas preventivas, do mais grave ao menos grave.
4. **Minha região:** escolha a região e veja risco, motivo e o que fazer.
5. **Sensores:** leituras de chuva e vento.

## Docker

```bash
docker build -t alertaclima .
docker run --rm -p 8501:8501 --env-file .env alertaclima
```

Sem `APP_SENHA_HASH` no ambiente, o contêiner abre como "Acesso bloqueado".

## Testes

```bash
python -m pytest tests -v
```

Plano e evidência em `docs/PLANO_DE_TESTES.md`.

## Arquivos

| Arquivo | O que faz |
|---|---|
| `main.py` | As 5 telas |
| `dados.py` | Lê Oracle (`REGIOES`, `DADOS_CLIMATICOS`, `OCORRENCIAS`, `ANALISE_RISCO`) ou usa simulação |
| `alertas.py` | Alerta com motivo e medidas; reaproveita a pontuação de `processamento/calcular_risco.py` |
| `seguranca.py` | Login por senha (PBKDF2), bloqueio por tentativas, falha fechada |
| `../iot/simulador_sensores.py` | Sensores simulados de chuva e vento (`TIPO_DADO = 'SENSOR'`) |

## Segurança

- A senha nunca vai para o Git: só o hash, em `APP_SENHA_HASH`.
- Sem `APP_SENHA_HASH` (e sem `APP_AUTH=off`), o app **não abre**.
- 5 tentativas erradas bloqueiam o login por 30 s (por sessão do navegador).
- O `.env` está no `.gitignore` e no `.dockerignore`.
- O detalhe de erros do Oracle vai para o log do servidor, não para a tela.

## Uso de IA generativa (declaração exigida pelo edital)

- **Claude Code (Anthropic)** foi usado para escrever o código de `app/`, `iot/` e `tests/`, os documentos em `docs/` e para auditar o resultado.
- **[PENDENTE — preencher só depois de feito]** Revisão humana do código por: ______ em ____/____/2026.
- Dados de exemplo e leituras de sensor são sintéticos.

## Limites conhecidos

- Os sensores são **simulados**; não há hardware conectado.
- No modo simulado, a "chuva" e o "vento" são as leituras dos sensores simulados das últimas 24 h, e alimentam a pontuação. No modo Oracle, o risco usa a previsão e o nível vem da última análise gravada.
- Os alertas são baseados em regras. A geração de texto por IA é da área de IA.
- A pontuação é experimental e não substitui alertas oficiais da Defesa Civil.
- Não testado contra um Oracle real, nem com Docker (sem Docker nesta máquina).
