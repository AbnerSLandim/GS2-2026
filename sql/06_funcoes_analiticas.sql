
-- ============================================================
-- ALERTACLIMA
-- 06 - FUNCOES ANALITICAS
-- Banco: Oracle Database
-- ============================================================


-- ============================================================
-- 1. RANKING DOS BAIRROS POR NIVEL DE RISCO
-- Identifica a analise mais recente de cada bairro
-- e classifica os bairros pela pontuacao.
-- ============================================================

WITH ULTIMAS_ANALISES AS (
    SELECT
        R.NOME_REGIAO,
        A.PONTUACAO_RISCO,
        A.NIVEL_RISCO,
        A.DATA_ANALISE,
        ROW_NUMBER() OVER (
            PARTITION BY A.ID_REGIAO
            ORDER BY A.DATA_ANALISE DESC, A.ID_ANALISE DESC
        ) AS RN
    FROM ANALISE_RISCO A
    JOIN REGIOES R
        ON A.ID_REGIAO = R.ID_REGIAO
)
SELECT
    NOME_REGIAO,
    PONTUACAO_RISCO,
    NIVEL_RISCO,
    DATA_ANALISE,
    RANK() OVER (
        ORDER BY PONTUACAO_RISCO DESC
    ) AS RANKING_RISCO
FROM ULTIMAS_ANALISES
WHERE RN = 1
ORDER BY RANKING_RISCO;


-- ============================================================
-- 2. EVOLUCAO DA PONTUACAO DE RISCO
-- Utiliza LAG() para comparar cada analise com a anterior.
-- ============================================================

WITH EVOLUCAO AS (
    SELECT
        R.NOME_REGIAO,
        A.DATA_ANALISE,
        A.PONTUACAO_RISCO,
        A.NIVEL_RISCO,

        LAG(A.PONTUACAO_RISCO) OVER (
            PARTITION BY A.ID_REGIAO
            ORDER BY A.DATA_ANALISE, A.ID_ANALISE
        ) AS PONTUACAO_ANTERIOR

    FROM ANALISE_RISCO A
    JOIN REGIOES R
        ON A.ID_REGIAO = R.ID_REGIAO
)
SELECT
    NOME_REGIAO,
    DATA_ANALISE,
    PONTUACAO_ANTERIOR,
    PONTUACAO_RISCO,

    PONTUACAO_RISCO - PONTUACAO_ANTERIOR
        AS VARIACAO_RISCO,

    CASE
        WHEN PONTUACAO_ANTERIOR IS NULL
            THEN 'PRIMEIRA ANALISE'
        WHEN PONTUACAO_RISCO > PONTUACAO_ANTERIOR
            THEN 'RISCO AUMENTOU'
        WHEN PONTUACAO_RISCO < PONTUACAO_ANTERIOR
            THEN 'RISCO DIMINUIU'
        ELSE 'RISCO ESTAVEL'
    END AS TENDENCIA

FROM EVOLUCAO
ORDER BY NOME_REGIAO, DATA_ANALISE;


-- ============================================================
-- 3. COMPARACAO ENTRE CHUVA PREVISTA E RISCO
-- Cruza a previsao das proximas 24 horas com a ultima
-- pontuacao de risco de cada bairro.
-- CORR() calcula a correlacao entre as duas variaveis.
-- ============================================================

WITH CLIMA AS (
    SELECT
        ID_REGIAO,
        SUM(PRECIPITACAO_MM) AS CHUVA_PREVISTA_24H,
        MAX(VELOCIDADE_VENTO) AS VENTO_MAXIMO_24H
    FROM DADOS_CLIMATICOS
    WHERE TIPO_DADO = 'PREVISAO'
      AND DATA_PREVISAO >= CURRENT_TIMESTAMP
      AND DATA_PREVISAO < CURRENT_TIMESTAMP
          + INTERVAL '24' HOUR
    GROUP BY ID_REGIAO
),

ULTIMA_ANALISE AS (
    SELECT
        ID_REGIAO,
        PONTUACAO_RISCO,
        NIVEL_RISCO
    FROM (
        SELECT
            ID_REGIAO,
            PONTUACAO_RISCO,
            NIVEL_RISCO,
            ROW_NUMBER() OVER (
                PARTITION BY ID_REGIAO
                ORDER BY DATA_ANALISE DESC, ID_ANALISE DESC
            ) AS RN
        FROM ANALISE_RISCO
    )
    WHERE RN = 1
),

COMPARACAO AS (
    SELECT
        R.NOME_REGIAO,
        C.CHUVA_PREVISTA_24H,
        C.VENTO_MAXIMO_24H,
        A.PONTUACAO_RISCO,
        A.NIVEL_RISCO
    FROM REGIOES R
    JOIN CLIMA C
        ON R.ID_REGIAO = C.ID_REGIAO
    JOIN ULTIMA_ANALISE A
        ON R.ID_REGIAO = A.ID_REGIAO
)

SELECT
    NOME_REGIAO,
    ROUND(CHUVA_PREVISTA_24H, 2) AS CHUVA_PREVISTA_24H,
    ROUND(VENTO_MAXIMO_24H, 2) AS VENTO_MAXIMO_24H,
    PONTUACAO_RISCO,
    NIVEL_RISCO,

    ROUND(
        CORR(CHUVA_PREVISTA_24H, PONTUACAO_RISCO) OVER (),
        4
    ) AS CORRELACAO_CHUVA_RISCO

FROM COMPARACAO
ORDER BY PONTUACAO_RISCO DESC;


-- ============================================================
-- 4. RANKING DE OCORRENCIAS POR BAIRRO
-- Identifica os bairros com maior quantidade de ocorrencias.
-- ============================================================

WITH TOTAL_OCORRENCIAS AS (
    SELECT
        R.ID_REGIAO,
        R.NOME_REGIAO,
        COUNT(O.ID_OCORRENCIA) AS TOTAL_OCORRENCIAS,

        SUM(
            CASE
                WHEN O.GRAVIDADE = 'ALTA' THEN 1
                WHEN O.GRAVIDADE = 'CRITICA' THEN 1
                ELSE 0
            END
        ) AS OCORRENCIAS_GRAVES

    FROM REGIOES R
    LEFT JOIN OCORRENCIAS O
        ON R.ID_REGIAO = O.ID_REGIAO

    GROUP BY
        R.ID_REGIAO,
        R.NOME_REGIAO
)
SELECT
    NOME_REGIAO,
    TOTAL_OCORRENCIAS,
    OCORRENCIAS_GRAVES,

    RANK() OVER (
        ORDER BY TOTAL_OCORRENCIAS DESC
    ) AS RANKING_OCORRENCIAS

FROM TOTAL_OCORRENCIAS
ORDER BY RANKING_OCORRENCIAS;
