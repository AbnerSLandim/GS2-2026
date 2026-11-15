
import os
import requests
import pandas as pd
import oracledb

from dotenv import load_dotenv

# =====================================================
# 1. CONFIGURACOES
# =====================================================

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DSN = os.getenv("DB_DSN")

# Regioes cadastradas no Oracle
REGIOES = [
    {
        "nome": "Centro",
        "latitude": -23.5505,
        "longitude": -46.6333
    },
    {
        "nome": "Mooca",
        "latitude": -23.5500,
        "longitude": -46.6000
    },
    {
        "nome": "Ipiranga",
        "latitude": -23.5850,
        "longitude": -46.6100
    },
    {
        "nome": "Vila Mariana",
        "latitude": -23.5890,
        "longitude": -46.6340
    },
    {
        "nome": "Butanta",
        "latitude": -23.5700,
        "longitude": -46.7200
    }
]

URL_API = "https://api.open-meteo.com/v1/forecast"


# =====================================================
# 2. COLETA DOS DADOS METEOROLOGICOS
# =====================================================

def coletar_dados(regiao):

    parametros = {
        "latitude": regiao["latitude"],
        "longitude": regiao["longitude"],
        "hourly": (
            "precipitation,"
            "wind_speed_10m,"
            "temperature_2m,"
            "relative_humidity_2m"
        ),
        "forecast_days": 2,
        "timezone": "America/Sao_Paulo"
    }

    resposta = requests.get(
        URL_API,
        params=parametros,
        timeout=30
    )

    resposta.raise_for_status()

    dados = resposta.json()

    df = pd.DataFrame({
        "data_previsao": dados["hourly"]["time"],
        "precipitacao_mm": dados["hourly"]["precipitation"],
        "velocidade_vento": dados["hourly"]["wind_speed_10m"],
        "temperatura": dados["hourly"]["temperature_2m"],
        "umidade": dados["hourly"]["relative_humidity_2m"]
    })

    df["regiao"] = regiao["nome"]

    return df


# =====================================================
# 3. TRATAMENTO DOS DADOS
# =====================================================

def tratar_dados(df):

    # Converter data para formato datetime
    df["data_previsao"] = pd.to_datetime(
        df["data_previsao"]
    )

    # Remover registros duplicados
    df = df.drop_duplicates(
        subset=["regiao", "data_previsao"]
    )

    # Remover registros sem informacoes essenciais
    df = df.dropna(
        subset=[
            "data_previsao",
            "precipitacao_mm",
            "velocidade_vento"
        ]
    )

    # Garantir que valores climaticos sejam numericos
    colunas_numericas = [
        "precipitacao_mm",
        "velocidade_vento",
        "temperatura",
        "umidade"
    ]

    for coluna in colunas_numericas:
        df[coluna] = pd.to_numeric(
            df[coluna],
            errors="coerce"
        )

    df = df.dropna(subset=colunas_numericas)

    # Filtrar valores fora dos limites fisicos esperados
    df = df[
        (df["precipitacao_mm"] >= 0) &
        (df["velocidade_vento"] >= 0) &
        (df["umidade"].between(0, 100))
    ]

    return df


# =====================================================
# 4. CONEXAO COM ORACLE
# =====================================================

def conectar_oracle():

    conexao = oracledb.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        dsn=DB_DSN
    )

    print("Conexao com Oracle realizada!")

    return conexao


# =====================================================
# 5. INSERCAO DOS DADOS NO ORACLE
# =====================================================

def salvar_dados(conexao, df):

    sql = """
        MERGE INTO DADOS_CLIMATICOS destino
        USING (
            SELECT
                :id_regiao AS id_regiao,
                :data_previsao AS data_previsao,
                :precipitacao AS precipitacao,
                :vento AS vento,
                :temperatura AS temperatura,
                :umidade AS umidade
            FROM dual
        ) origem
        ON (
            destino.ID_REGIAO = origem.id_regiao
            AND destino.DATA_PREVISAO = origem.data_previsao
            AND destino.TIPO_DADO = 'PREVISAO'
        )
        WHEN MATCHED THEN UPDATE SET
            destino.PRECIPITACAO_MM = origem.precipitacao,
            destino.VELOCIDADE_VENTO = origem.vento,
            destino.TEMPERATURA = origem.temperatura,
            destino.UMIDADE = origem.umidade
        WHEN NOT MATCHED THEN INSERT (
            ID_REGIAO,
            DATA_PREVISAO,
            PRECIPITACAO_MM,
            VELOCIDADE_VENTO,
            TEMPERATURA,
            UMIDADE,
            TIPO_DADO
        )
        VALUES (
            origem.id_regiao,
            origem.data_previsao,
            origem.precipitacao,
            origem.vento,
            origem.temperatura,
            origem.umidade,
            'PREVISAO'
        )
    """

    cursor = conexao.cursor()

    try:
        for _, linha in df.iterrows():

            cursor.execute(
                sql,
                {
                    "id_regiao": linha["id_regiao"],
                    "data_previsao": linha["data_previsao"].to_pydatetime(),
                    "precipitacao": float(linha["precipitacao_mm"]),
                    "vento": float(linha["velocidade_vento"]),
                    "temperatura": float(linha["temperatura"]),
                    "umidade": float(linha["umidade"])
                }
            )

        conexao.commit()

        print(f"{len(df)} registros processados no Oracle!")

    except Exception:
        conexao.rollback()
        raise

    finally:
        cursor.close()


# =====================================================
# 6. EXECUCAO DO PIPELINE
# =====================================================

def executar_pipeline():

    dados_completos = []

    print("\nIniciando coleta meteorologica...\n")

    # Coletar dados de todas as regioes
    for regiao in REGIOES:

        print(f"Consultando: {regiao['nome']}")

        try:
            df = coletar_dados(regiao)
            dados_completos.append(df)

            print(f"{len(df)} registros coletados!")

        except requests.RequestException as erro:
            print(f"Erro na API para {regiao['nome']}: {erro}")

    if not dados_completos:
        print("Nenhum dado foi coletado.")
        return

    # Unir os dados das regioes
    df_final = pd.concat(
        dados_completos,
        ignore_index=True
    )

    # Tratar dados
    df_final = tratar_dados(df_final)

    print("\nResumo dos dados coletados:")
    print(df_final.head())

    print("\nTotal de registros:", len(df_final))

    conexao = conectar_oracle()

    try:
        cursor = conexao.cursor()

        # Relacionar nome da regiao ao ID do Oracle
        cursor.execute("""
            SELECT ID_REGIAO, NOME_REGIAO
            FROM REGIOES
        """)

        regioes_banco = {
            nome: id_regiao
            for id_regiao, nome in cursor.fetchall()
        }

        cursor.close()

        df_final["id_regiao"] = df_final["regiao"].map(
            regioes_banco
        )

        if df_final["id_regiao"].isna().any():
            raise ValueError(
                "Existe regiao sem cadastro no Oracle."
            )

        salvar_dados(conexao, df_final)

    finally:
        conexao.close()

    print("\nPipeline finalizado com sucesso!")


if __name__ == "__main__":
    executar_pipeline()
