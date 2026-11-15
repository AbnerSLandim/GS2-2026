-- =====================================================
-- PROJETO: ALERTACLIMA
-- ARQUIVO: 03_alteracoes_tabelas.sql
-- MIGRACAO: ADICIONA A DATA/HORA-ALVO DA PREVISAO
-- EXECUTAR UMA VEZ EM BANCOS QUE AINDA NAO POSSUEM A COLUNA
-- =====================================================

ALTER TABLE DADOS_CLIMATICOS
ADD DATA_PREVISAO TIMESTAMP;

-- DATA_REGISTRO registra quando o dado entrou no banco.
-- DATA_PREVISAO registra para qual horario a previsao meteorologica vale.

ALTER TABLE REGIOES
ADD CONSTRAINT UK_REGIOES_NOME
UNIQUE (NOME_REGIAO);