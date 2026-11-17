# AlertaClima — plataforma (MVP, IoT e experiência digital)

Site em **React** (`web/`) servido por uma **API FastAPI** (`api/`), usando a lógica testada em `app/` e `iot/`
e os dados do Oracle do módulo de Big Data (ou dados simulados, sempre sinalizados na tela).

| Pasta | O que é |
|---|---|
| `web/` | Site: landing, Meu bairro (público) e painel da Defesa Civil (login) com visão geral, indicadores, mapa, alertas e sensores ao vivo |
| `api/main.py` | API: rotas públicas e protegidas, login com cookie seguro, streaming dos sensores (SSE), serve o site |
| `app/` | Regras: pontuação e alertas (`alertas.py`), dados (`dados.py`), indicadores do Big Data (`indicadores.py`), sensores ao vivo (`ao_vivo.py`), segurança (`seguranca.py`) |
| `iot/simulador_sensores.py` | Sensores simulados de chuva e vento (`TIPO_DADO = 'SENSOR'`) |

## Requisitos

- Python 3.11 ou 3.12
- Node.js 20 ou mais novo

## Como rodar

```bash
pip install -r requirements.txt
npm --prefix web ci
npm --prefix web run build
python -m app.seguranca            # pede uma senha e imprime o hash
```

Crie um `.env` na raiz com **apenas** a linha do hash (os `DB_*` só se houver um Oracle de verdade):

```env
APP_SENHA_HASH=<hash impresso acima>
```

```bash
python -m uvicorn api.main:app --port 8000
```

Abra `http://localhost:8000`. O painel fica em `/painel` (pede a senha).
Para gravar o vídeo: `http://localhost:8000/?apresentacao=auto` em tela cheia (F11).

**Desenvolvimento do site:** com a API rodando, `npm --prefix web run dev` (o Vite repassa `/api` para a porta 8000).

## Docker

```bash
docker build -t alertaclima .
docker run --rm -p 8000:8000 --env-file .env alertaclima
```

## Testes

```bash
python -m pytest tests -v
npm --prefix web run lint
```

## Segurança

- Senha só como hash PBKDF2 (`APP_SENHA_HASH`); sessão em cookie HttpOnly/SameSite=Strict assinado (HMAC), 8 h.
- 5 senhas erradas bloqueiam o IP por 30 s. Sem senha configurada, o painel não abre (503).
- Cabeçalhos de segurança em todas as respostas; erro do Oracle nunca vai para o navegador.
- `.env` fora do Git e da imagem Docker.

## Uso de IA generativa (declaração exigida pelo edital)

- **Claude Code (Anthropic)** foi usado para escrever e revisar o código de `api/`, `app/`, `iot/`, `web/` e `tests/` e os documentos em `docs/`.
- **[PENDENTE — preencher só depois de feito]** Revisão humana do código por: ______ em ____/____/2026.

## Limites conhecidos

- Sensores e ocorrências da demonstração são **simulados**.
- A pontuação de risco é experimental e não substitui alertas oficiais da Defesa Civil.
- Não testado contra um Oracle real. Mapa usa tiles do OpenStreetMap (uso justo).
