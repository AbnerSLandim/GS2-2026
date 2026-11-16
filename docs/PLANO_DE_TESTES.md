# Plano de testes — AlertaClima (MVP, IoT e DevOps)

Critério da Global Solution, área 4: "Plano com 5+ casos e evidências da execução".

**Execução:** 2026-11-16, Python 3.11.5, Windows, `pytest 9.2.0`.
**Evidência bruta:** [`docs/evidencias/pytest_2026-11-16.txt`](evidencias/pytest_2026-11-16.txt) — 29 testes, 29 passaram, 5,19 s.
**Como reproduzir:** `pip install -r requirements.txt` e `python -m pytest tests -v`.

Os testes rodam **sem Oracle e sem internet**. O Oracle é simulado por dados locais ou por um objeto falso.

## Casos de teste

| ID | Caso | Entrada | Resultado esperado | Teste automatizado | Resultado |
|---|---|---|---|---|---|
| T01 | Pontuação de risco igual à do Big Data | chuva 20 mm, vento 50 km/h, histórico 40 | 59,5 | `test_alertas::test_pontuar_usa_mesma_formula_do_big_data` | ✅ passou |
| T02 | Alerta crítico traz motivo e medidas | chuva 35 mm, vento 85 km/h | nível CRITICO, motivo cita chuva e vento, medidas incluem 199 | `test_alertas::test_alerta_critico_tem_motivo_e_medidas` | ✅ passou |
| T03 | Motivo considera o histórico de ocorrências | 5 ocorrências | motivo cita "5 ocorrências" | `test_contrato_big_data::test_motivo_do_alerta_considera_o_historico` | ✅ passou |
| T04 | Alertas ordenados do mais grave ao menos grave | 3 alertas | ordem B, C, A | `test_alertas::test_ordenar_do_mais_grave_ao_menos_grave` | ✅ passou |
| T05 | App fechado sem senha configurada | sem `APP_SENHA_HASH` | "Acesso bloqueado", nenhum dado exibido | `test_app_streamlit::test_sem_configuracao_o_app_fica_bloqueado` | ✅ passou |
| T06 | Login com senha errada e certa | "errada", depois "certa" | erro e sem dados; depois painel liberado | `test_app_streamlit::test_login_errado_e_certo` | ✅ passou |
| T07 | Bloqueio após 5 tentativas erradas | 5 senhas erradas | "Muitas tentativas" | `test_app_streamlit::test_bloqueio_apos_tentativas_erradas` | ✅ passou |
| T08 | Hash de senha seguro | mesma senha duas vezes; hash malformado | hashes diferentes (sal); malformado nunca autentica | `test_seguranca` (5 testes) | ✅ passou |
| T09 | As 5 telas abrem sem erro | navegar por todas | nenhuma exceção | `test_app_streamlit::test_cinco_telas_funcionam` | ✅ passou |
| T10 | Fluxo completo do cidadão | escolher Butanta, depois Centro | risco, motivo e medidas mudam com a região | `test_app_streamlit::test_fluxo_minha_regiao_muda_com_a_escolha` | ✅ passou |
| T11 | Sensores simulados válidos e repetíveis | semente fixa | mesmas leituras; chuva ≥ 0, vento ≥ 0, umidade 0–100 | `test_iot_e_dados::test_simulador_e_deterministico_e_valido` | ✅ passou |
| T12 | Regiões do MVP iguais ao seed do Oracle | `sql/02_dados_iniciais.sql` | mesmos nomes e coordenadas | `test_contrato_big_data::test_regioes_do_mvp_batem_com_o_seed_do_oracle` | ✅ passou |
| T13 | Gravar sensores com região não cadastrada | Oracle falso só com "Centro" | erro explícito, nada inserido | `test_contrato_big_data::test_gravar_falha_alto_se_regiao_nao_cadastrada` | ✅ passou |
| T14 | Oracle fora do ar | conexão falha | cai no simulado com aviso, sem expor o erro | `test_iot_e_dados::test_oracle_indisponivel_cai_no_simulado_com_aviso` | ✅ passou |
| T15 | `.env` fora do Git | `.gitignore` | `.env` ignorado | `test_contrato_big_data::test_gitignore_protege_env` | ✅ passou |

## O que este plano NÃO cobre

- **Oracle real:** nenhuma consulta SQL foi executada contra um banco. As consultas foram só revisadas contra o schema.
- **Navegador real:** o app foi exercitado pelo `AppTest` do Streamlit, não visto num navegador. Mapa com tiles do OpenStreetMap não foi conferido visualmente.
- **Docker e CI:** o build da imagem e o workflow do GitHub Actions ainda **não foram executados** (sem Docker nesta máquina; branch não enviada). Veja `docs/FONTE_DA_VERDADE.md`.
- **Sensores físicos:** não existem; os sensores são simulados.
