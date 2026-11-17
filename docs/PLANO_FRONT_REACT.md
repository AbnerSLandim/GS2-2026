# Plano — AlertaClima em React (substitui a interface Streamlit)

Objetivo: um site com cara de **produto profissional** (padrão que uma empresa como a Oracle levaria a sério),
mantendo a lógica já testada em Python. Prazo da entrega: 19/11/2026.

## 1. Arquitetura

```
web/  (React + Vite + TypeScript)  ──fetch/SSE──►  api/  (FastAPI)  ──►  app/ (lógica já testada)
                                                                   └──►  Oracle (se configurado) ou simulação
```

- **Reaproveitar sem reescrever:** `app/dados.py`, `app/alertas.py`, `app/ao_vivo.py` (funções puras), `app/seguranca.py`, `iot/simulador_sensores.py`, `processamento/calcular_risco.py`.
- **Remover a interface Streamlit:** `app/main.py`, `app/apresentacao.py`, `.streamlit/`, `tests/test_app_streamlit.py` e a dependência `streamlit`. A parte de streaming em `app/ao_vivo.py` que usa Streamlit vira só lógica.
- **Um comando para rodar:** `npm --prefix web run build` e depois `python -m uvicorn api.main:app --port 8000`. A API serve o build do React em `/`.

## 2. API (FastAPI) — `api/main.py`

| Método | Rota | Acesso | Retorna |
|---|---|---|---|
| GET | `/api/saude` | público | `{status, fonte: "ORACLE"|"SIMULADO"}` |
| GET | `/api/regioes` | público | lista de regiões com nível, pontuação, chuva, vento, ocorrências, lat/lon e alerta (motivo + medidas) — é o que o cidadão vê |
| POST | `/api/login` | público | `{senha}` → cookie de sessão HttpOnly, SameSite=Strict, assinado com HMAC (`APP_SECRET`, ou aleatório na subida) |
| POST | `/api/logout` | logado | apaga o cookie |
| GET | `/api/me` | — | `{autenticado: bool}` |
| GET | `/api/painel` | logado | indicadores + regiões (para o painel operacional) |
| GET | `/api/sensores` | logado | leituras das últimas 24 h |
| GET | `/api/stream` | logado | **Server-Sent Events**: a cada ~0,8 s, novas leituras + risco recalculado (usar `ao_vivo.nova_leitura` e `ao_vivo.risco_por_regiao`) |

Segurança (manter e melhorar): hash PBKDF2 do `APP_SENHA_HASH`; **bloqueio por IP** (5 erros → 30 s), não mais por sessão;
falha fechada sem senha configurada (as rotas logadas respondem 503 com mensagem clara); cabeçalhos
`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`; erro do Oracle nunca vai para o cliente.

### Contrato JSON (front e API seguem exatamente isto)

```jsonc
// Regiao (usada em /api/regioes e /api/painel)
{ "nome": "Butanta", "lat": -23.57, "lon": -46.72, "nivel": "CRITICO", "pontuacao": 77.5,
  "chuva_mm": 28.1, "vento_kmh": 50.0, "ocorrencias": 4, "data_analise": null,
  "alerta": { "motivo": "Risco elevado por ...", "medidas": ["...", "..."] } }

GET /api/regioes  -> { "fonte": "SIMULADO", "atualizado_em": "2026-11-16T22:30:00", "regioes": [Regiao, ...] }  // ordenadas do mais grave
GET /api/painel   -> { "fonte": "...", "atualizado_em": "...",
                       "indicadores": { "regioes": 5, "em_alerta": 3, "chuva_max_mm": 28.1, "vento_max_kmh": 50, "ocorrencias": 15 },
                       "regioes": [Regiao, ...] }
GET /api/sensores -> { "fonte": "...", "leituras": [ { "data": "2026-11-16T21:00:00", "regiao": "Centro", "chuva_mm": 0.4, "vento_kmh": 18.2 } ] }
GET /api/me       -> { "autenticado": true, "auth_configurada": true }
POST /api/login {"senha": "..."} -> 200 {"ok": true} | 401 {"erro": "Senha incorreta."} | 429 {"erro": "...", "tentar_em_s": 30} | 503 {"erro": "Acesso não configurado."}
GET /api/stream   -> text/event-stream, evento "leituras" a cada ~0,8 s:
   data: { "tick": 3, "momento": "...", "total": 75, "novas": [Leitura x5], "risco": [ { "nome": "...", "nivel": "...", "pontuacao": 61.0, "chuva_24h_mm": 12.3, "vento_max_kmh": 44 } ] }
```
O front em desenvolvimento usa o proxy do Vite (`/api` → `http://127.0.0.1:8000`).

## 3. Produto e telas

**Ideia de produto:** o cidadão acessa sem login e vê o risco do seu bairro; a Defesa Civil/operador entra com senha no painel.

Público:
1. **Início (landing):** hero forte ("Saiba antes da água chegar"), resumo do risco agora na cidade (contagem por nível), CTA "Ver meu bairro", como funciona em 3 passos, ODS 11 e 13, rodapé com o projeto FIAP.
2. **Meu bairro:** busca/seleção do bairro → cartão grande com o nível (cor + ícone), pontuação em um medidor circular, motivo em linguagem simples, medidas preventivas em checklist, telefones 199/193 em destaque quando ALTO/CRÍTICO.

Painel (login):
3. **Visão geral:** KPIs em cartões (regiões em alerta, maior chuva, maior vento, ocorrências), ranking de risco em barras horizontais coloridas, tabela elegante.
4. **Mapa de riscos:** mapa grande (Leaflet + OpenStreetMap), círculos por nível e tamanho por pontuação, popup com motivo, legenda própria.
5. **Alertas:** cartões ordenados do mais grave, com selo de nível, motivo, medidas, data da análise.
6. **Sensores ao vivo:** indicador "AO VIVO" pulsando, contadores animados, gráfico de linhas atualizando em tempo real (SSE), feed das últimas leituras, cartões de risco por bairro mudando de cor ao vivo.
7. **Sobre / Arquitetura:** diagrama das 4 áreas (IA, Big Data, MVP/IoT, DevOps) e como se conectam, stack, e o aviso de dados simulados.

**Modo apresentação** (`/?apresentacao=auto`): percorre as telas com uma legenda elegante no topo e
avanço automático, ~2:50 no total (mesma ordem e textos do `app/apresentacao.py` atual, com o login mostrado de forma ilustrativa e sem desligar a autenticação real). Na gravação, roda com uma sessão já autenticada.

## 4. Direção visual (obrigatória)

Referência de nível: Linear, Vercel, Stripe, Apple Weather. **Clean, claro, com muito respiro**, sofisticado
e calmo, mas transmitindo urgência só onde há risco. Deve parecer um produto real, não trabalho de faculdade.

- **Tema claro como padrão** (modo escuro opcional com alternância, mesma qualidade): fundo `#F7F8FA`,
  superfícies brancas, bordas `#E6E8EE`, texto `#0F172A`, texto secundário `#64748B`.
- **Marca:** azul profundo `#1D4ED8` para ações e foco; logotipo próprio simples (gota/onda em SVG + "AlertaClima").
  Gradiente sutil (azul → ciano) e um fundo com textura discreta (grade ou isóbaras em SVG) **só no hero**.
- **Cores de risco (sempre as mesmas):** BAIXO `#16A34A`, MODERADO `#CA8A04`, ALTO `#EA580C`, CRÍTICO `#DC2626`,
  com fundos suaves correspondentes (ex.: `#FEF2F2` para crítico). Vermelho nunca é cor de marca.
- **Tipografia:** Inter (`@fontsource-variable/inter`, sem CDN); títulos 650–800 com tracking levemente negativo;
  números tabulares e grandes nos KPIs.
- **Componentes:** cantos 12–16 px, sombras muito suaves em camadas, bordas finas, grade de 8 px, ícones `lucide-react`,
  nada de emoji na interface.
- **Movimento:** `framer-motion` para entradas sutis (fade + 8 px), contadores animados, transição entre telas,
  pulso no "AO VIVO", barras e medidores animando ao carregar. Respeitar `prefers-reduced-motion`.
- **Mapa:** Leaflet com base clara e limpa (CARTO Positron), círculos com halo na cor do risco, popup estilizado.
- **Gráficos:** linhas suaves, sem grade pesada, tooltip limpo, cores consistentes por bairro.
- **Microinterações e UX:** estados de carregamento com skeleton, estados vazios bem escritos, feedback de erro claro,
  navegação lateral com ícones no painel, atalho de busca do bairro, textos curtos e diretos em português.
- **Responsivo:** perfeito em 1920×1080 (gravação) e no celular (cidadão).
- **Acessibilidade:** contraste AA, nível nunca só por cor (sempre com texto/ícone), foco visível, labels nos controles.
- **Bibliotecas:** React 18, Vite, TypeScript, Tailwind CSS, react-router, framer-motion, react-leaflet + leaflet,
  recharts, lucide-react, @fontsource-variable/inter. Versões fixas.

## 4.1 Ajustes do Aldrin (prevalecem sobre a seção 4)

- **Nada de "cara de IA":** sem gradiente roxo/azul genérico, sem blobs, sem glassmorphism, sem cards todos iguais em grade,
  sem ícone dentro de círculo colorido repetido, sem hero "centralizado + 2 botões" de template.
- **Design humano e editorial:** inspiração em infográficos de clima de jornal (NYT/The Guardian climate, Windy, Apple Weather),
  layout assimétrico, números grandes como protagonistas, isóbaras/linhas de chuva desenhadas em SVG, hierarquia tipográfica forte.
- **Tipografia:** **Montserrat** para títulos e números (`@fontsource-variable/montserrat`) + uma sans humanista para texto
  (ex.: `@fontsource-variable/source-sans-3` ou `@fontsource/ibm-plex-sans`). Sem CDN.
- **Paleta própria e sóbria:** papel/off-white, tinta escura, um azul-petróleo como marca; as cores de risco são as únicas cores fortes.

## 4.2 Integração do Big Data do Joy

O `dashboard.py` (Streamlit) do Joy vira a tela **"Indicadores"** do painel React (`/painel/indicadores`):
ranking de risco, evolução do risco em 7 dias com variação (a mesma lógica do `LAG()` dele), previsão hora a hora
(chuva e temperatura) e ocorrências por bairro e gravidade. Dá crédito: "Módulo de Big Data e visualização — Joy".

API: `GET /api/indicadores` (logado) →
`{ "fonte", "ranking": [{"nome","pontuacao","nivel"}], "evolucao": [{"data","regiao","pontuacao","variacao","tendencia"}],
"previsao": [{"data","regiao","chuva_mm","temperatura","umidade","vento_kmh"}], "ocorrencias": [{"regiao","gravidade","total"}] }`.
Com Oracle, usa as consultas SQL do `dashboard.py` (SQL_HISTORICO, SQL_PREVISAO, SQL_OCORRENCIAS); sem Oracle, gera dados
simulados coerentes (7 dias de análises, 48 h de previsão, ocorrências de `OCORRENCIAS_DEMO`).

## 5. Qualidade

- `pytest`: testes da API com `TestClient` (login certo/errado, bloqueio por IP, rotas protegidas 401, falha fechada 503, `/api/regioes` com 5 regiões, SSE entrega eventos), mantendo os testes de lógica que já existem.
- `npm --prefix web run build` sem erro e `npm --prefix web run lint` (tsc) sem erro.
- CI: instala Node e Python, builda o front, roda pytest e builda o Docker (multi-stage: node build → python).
- Dockerfile atualizado; README com os comandos novos.
