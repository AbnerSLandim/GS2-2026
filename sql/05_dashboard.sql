
-- =====================================================
-- PROJETO: ALERTACLIMA
-- ARQUIVO: 05_dashboard.sql
-- CONSULTAS PARA ALIMENTAR O DASHBOARD
-- =====================================================


-- =====================================================
-- 1. RESUMO GERAL DO DASHBOARD
-- Indicadores principais (cards)
-- =====================================================


-- =====================================================
-- 1. RESUMO GERAL DO DASHBOARD
-- Indicadores principais (cards)
-- =====================================================

WITH ULTIMAS_ANALISES AS (
    SELECT
        ID_REGIAO,
        NIVEL_RISCO,
        PONTUACAO_RISCO,
        ROW_NUMBER() OVER (
            PARTITION BY ID_REGIAO
            ORDER BY DATA_ANALISE DESC, ID_ANALISE DESC
        ) AS RN
    FROM ANALISE_RISCO
),

TOTAL_REGIOES AS (
    SELECT COUNT(*) AS TOTAL_BAIRROS
    FROM REGIOES
)

SELECT
    T.TOTAL_BAIRROS,

    COUNT(*) AS BAIRROS_ANALISADOS,

    COUNT(CASE WHEN U.NIVEL_RISCO = 'BAIXO'
        THEN 1 END) AS RISCO_BAIXO,

    COUNT(CASE WHEN U.NIVEL_RISCO = 'MODERADO'
        THEN 1 END) AS RISCO_MODERADO,

    COUNT(CASE WHEN U.NIVEL_RISCO = 'ALTO'
        THEN 1 END) AS RISCO_ALTO,

    COUNT(CASE WHEN U.NIVEL_RISCO = 'CRITICO'
        THEN 1 END) AS RISCO_CRITICO,

    ROUND(AVG(U.PONTUACAO_RISCO), 2)
        AS MEDIA_PONTUACAO_RISCO

FROM ULTIMAS_ANALISES U

CROSS JOIN TOTAL_REGIOES T

WHERE U.RN = 1

GROUP BY T.TOTAL_BAIRROS;



-- =====================================================
-- 2. PAINEL PRINCIPAL POR BAIRRO
-- Reúne clima, ocorrências e análise de risco
-- =====================================================

WITH CLIMA AS (
    SELECT
        ID_REGIAO,
        COUNT(*) AS HORAS_ANALISADAS,
        ROUND(SUM(PRECIPITACAO_MM), 2) AS CHUVA_24H,
        ROUND(AVG(TEMPERATURA), 1) AS TEMPERATURA_MEDIA,
        ROUND(AVG(UMIDADE), 1) AS UMIDADE_MEDIA,
        ROUND(AVG(VELOCIDADE_VENTO), 1) AS VENTO_MEDIO,
        ROUND(MAX(VELOCIDADE_VENTO), 1) AS VENTO_MAXIMO
    FROM DADOS_CLIMATICOS
    WHERE TIPO_DADO = 'PREVISAO'
      AND DATA_PREVISAO >= CURRENT_TIMESTAMP
      AND DATA_PREVISAO < CURRENT_TIMESTAMP + INTERVAL '24' HOUR
    GROUP BY ID_REGIAO
),

HISTORICO AS (
    SELECT
        ID_REGIAO,
        COUNT(*) AS TOTAL_OCORRENCIAS,
        SUM(CASE WHEN GRAVIDADE = 'ALTA'
            THEN 1 ELSE 0 END) AS OCORRENCIAS_ALTAS,
        SUM(CASE WHEN GRAVIDADE = 'CRITICA'
            THEN 1 ELSE 0 END) AS OCORRENCIAS_CRITICAS
    FROM OCORRENCIAS
    GROUP BY ID_REGIAO
),

ULTIMA_ANALISE AS (
    SELECT
        ID_REGIAO,
        PONTUACAO_RISCO,
        NIVEL_RISCO,
        DATA_ANALISE,
        ROW_NUMBER() OVER (
            PARTITION BY ID_REGIAO
            ORDER BY DATA_ANALISE DESC, ID_ANALISE DESC
        ) AS RN
    FROM ANALISE_RISCO
)

SELECT
    R.NOME_REGIAO,

    NVL(C.HORAS_ANALISADAS, 0) AS HORAS_ANALISADAS,
    NVL(C.CHUVA_24H, 0) AS CHUVA_PREVISTA_24H,
    C.TEMPERATURA_MEDIA,
    C.UMIDADE_MEDIA,
    C.VENTO_MEDIO,
    C.VENTO_MAXIMO,

    NVL(H.TOTAL_OCORRENCIAS, 0) AS TOTAL_OCORRENCIAS,
    NVL(H.OCORRENCIAS_ALTAS, 0) AS OCORRENCIAS_ALTAS,
    NVL(H.OCORRENCIAS_CRITICAS, 0) AS OCORRENCIAS_CRITICAS,

    A.PONTUACAO_RISCO,
    A.NIVEL_RISCO,
    A.DATA_ANALISE

FROM REGIOES R

LEFT JOIN CLIMA C
    ON C.ID_REGIAO = R.ID_REGIAO

LEFT JOIN HISTORICO H
    ON H.ID_REGIAO = R.ID_REGIAO

LEFT JOIN ULTIMA_ANALISE A
    ON A.ID_REGIAO = R.ID_REGIAO
   AND A.RN = 1

ORDER BY A.PONTUACAO_RISCO DESC NULLS LAST;


-- =====================================================
-- 3. PREVISAO CLIMATICA HORA A HORA
-- Dados para gráfico de linha
-- Próximas 48 horas
-- =====================================================

SELECT
    R.NOME_REGIAO,
    C.DATA_PREVISAO,
    C.PRECIPITACAO_MM,
    C.VELOCIDADE_VENTO,
    C.TEMPERATURA,
    C.UMIDADE

FROM DADOS_CLIMATICOS C

JOIN REGIOES R
    ON R.ID_REGIAO = C.ID_REGIAO

WHERE C.TIPO_DADO = 'PREVISAO'
  AND C.DATA_PREVISAO >= CURRENT_TIMESTAMP
  AND C.DATA_PREVISAO < CURRENT_TIMESTAMP + INTERVAL '48' HOUR

ORDER BY C.DATA_PREVISAO, R.NOME_REGIAO;


-- =====================================================
-- 4. HISTORICO DE EVOLUCAO DO RISCO
-- Dados para gráfico de linha
-- Últimos 7 dias
-- =====================================================

SELECT
    R.NOME_REGIAO,
    A.DATA_ANALISE,
    A.PONTUACAO_RISCO,
    A.NIVEL_RISCO

FROM ANALISE_RISCO A

JOIN REGIOES R
    ON R.ID_REGIAO = A.ID_REGIAO

WHERE A.DATA_ANALISE >= CURRENT_TIMESTAMP - INTERVAL '7' DAY

ORDER BY A.DATA_ANALISE, R.NOME_REGIAO;


-- =====================================================
-- 5. OCORRENCIAS POR GRAVIDADE E BAIRRO
-- Dados para gráfico de barras
-- =====================================================

SELECT
    R.NOME_REGIAO,

    COUNT(O.ID_OCORRENCIA) AS TOTAL_OCORRENCIAS,

    SUM(CASE WHEN O.GRAVIDADE = 'BAIXA'
        THEN 1 ELSE 0 END) AS GRAVIDADE_BAIXA,

    SUM(CASE WHEN O.GRAVIDADE = 'MEDIA'
        THEN 1 ELSE 0 END) AS GRAVIDADE_MEDIA,

    SUM(CASE WHEN O.GRAVIDADE = 'ALTA'
        THEN 1 ELSE 0 END) AS GRAVIDADE_ALTA,

    SUM(CASE WHEN O.GRAVIDADE = 'CRITICA'
        THEN 1 ELSE 0 END) AS GRAVIDADE_CRITICA

FROM REGIOES R

LEFT JOIN OCORRENCIAS O
    ON O.ID_REGIAO = R.ID_REGIAO

GROUP BY R.NOME_REGIAO

ORDER BY TOTAL_OCORRENCIAS DESC;


-- =====================================================
-- 6. DISTRIBUICAO DOS NIVEIS DE RISCO
-- Dados para gráfico de pizza
-- Considera somente a análise mais recente
-- =====================================================

SELECT
    NIVEL_RISCO,
    COUNT(*) AS TOTAL_BAIRROS

FROM (
    SELECT
        ID_REGIAO,
        NIVEL_RISCO,

        ROW_NUMBER() OVER (
            PARTITION BY ID_REGIAO
            ORDER BY DATA_ANALISE DESC, ID_ANALISE DESC
        ) AS RN

    FROM ANALISE_RISCO
)

WHERE RN = 1

GROUP BY NIVEL_RISCO

ORDER BY TOTAL_BAIRROS DESC;


-- =====================================================
-- FIM DAS CONSULTAS DO DASHBOARD
-- =====================================================
