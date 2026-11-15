
import os
import oracledb
from dotenv import load_dotenv

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_DSN = os.getenv("DB_DSN")


def conectar_oracle():
    """Estabelece conexão com o Oracle."""

    if not DB_USER or not DB_PASSWORD or not DB_DSN:
        raise ValueError(
            "Verifique as configurações do arquivo .env"
        )

    return oracledb.connect(
        user=DB_USER,
        password=DB_PASSWORD,
        dsn=DB_DSN
    )


def calcular_pontuacao_chuva(chuva_mm):
    """Calcula a pontuação da precipitação."""

    if chuva_mm <= 1:
        return 0
    elif chuva_mm <= 5:
        return 20
    elif chuva_mm <= 15:
        return 50
    elif chuva_mm <= 30:
        return 75
    else:
        return 100


def calcular_pontuacao_vento(vento_kmh):
    """Calcula a pontuação da velocidade máxima do vento."""

    if vento_kmh <= 20:
        return 0
    elif vento_kmh <= 40:
        return 25
    elif vento_kmh <= 60:
        return 50
    elif vento_kmh <= 80:
        return 75
    else:
        return 100


def calcular_nivel_risco(pontuacao):
    """Classifica o risco final."""

    if pontuacao < 25:
        return "BAIXO"
    elif pontuacao < 50:
        return "MODERADO"
    elif pontuacao < 75:
        return "ALTO"
    else:
        return "CRITICO"


def buscar_dados_regiao(cursor, id_regiao):
    """Consulta clima e histórico de ocorrências."""

    # Consulta previsão das próximas 24 horas
    cursor.execute("""
        SELECT
            COUNT(*),
            NVL(SUM(PRECIPITACAO_MM), 0),
            NVL(MAX(VELOCIDADE_VENTO), 0)
        FROM DADOS_CLIMATICOS
        WHERE ID_REGIAO = :id_regiao
          AND TIPO_DADO = 'PREVISAO'
          AND DATA_PREVISAO >= CURRENT_TIMESTAMP
          AND DATA_PREVISAO < CURRENT_TIMESTAMP + INTERVAL '24' HOUR
    """, {"id_regiao": id_regiao})

    horas, chuva_mm, vento_maximo = cursor.fetchone()

    if horas == 0:
        return None

    # Consulta histórico de ocorrências
    cursor.execute("""
        SELECT
            COUNT(*),
            NVL(SUM(
                CASE
                    WHEN GRAVIDADE = 'BAIXA' THEN 5
                    WHEN GRAVIDADE = 'MEDIA' THEN 10
                    WHEN GRAVIDADE = 'ALTA' THEN 20
                    WHEN GRAVIDADE = 'CRITICA' THEN 30
                    ELSE 0
                END
            ), 0)
        FROM OCORRENCIAS
        WHERE ID_REGIAO = :id_regiao
    """, {"id_regiao": id_regiao})

    total_ocorrencias, pontos_historicos = cursor.fetchone()

    return {
        "horas": horas,
        "chuva_mm": float(chuva_mm),
        "vento_maximo": float(vento_maximo),
        "total_ocorrencias": total_ocorrencias,
        "pontos_historicos": min(float(pontos_historicos), 100)
    }


def executar_calculo():

    conexao = None
    cursor = None

    try:
        print("Iniciando calculo de risco do AlertaClima...\n")

        conexao = conectar_oracle()
        cursor = conexao.cursor()

        print("Conexao com Oracle realizada!\n")

        cursor.execute("""
            SELECT ID_REGIAO, NOME_REGIAO
            FROM REGIOES
            ORDER BY NOME_REGIAO
        """)

        regioes = cursor.fetchall()

        for id_regiao, nome_regiao in regioes:

            print("=" * 50)
            print(f"Regiao: {nome_regiao}")

            dados = buscar_dados_regiao(cursor, id_regiao)

            if dados is None:
                print("Sem previsao disponivel. Regiao ignorada.\n")
                continue

            # Pontuacoes individuais
            pontuacao_chuva = calcular_pontuacao_chuva(
                dados["chuva_mm"]
            )

            pontuacao_vento = calcular_pontuacao_vento(
                dados["vento_maximo"]
            )

            pontuacao_historica = dados["pontos_historicos"]

            # Calculo ponderado
            pontuacao_final = (
                pontuacao_chuva * 0.50
                + pontuacao_vento * 0.20
                + pontuacao_historica * 0.30
            )

            pontuacao_final = round(pontuacao_final, 2)

            nivel_risco = calcular_nivel_risco(pontuacao_final)

            justificativa = (
                f"Chuva prevista: {dados['chuva_mm']:.2f} mm em "
                f"{dados['horas']} horas. "
                f"Vento maximo: {dados['vento_maximo']:.2f} km/h. "
                f"Ocorrencias historicas: "
                f"{dados['total_ocorrencias']}. "
                f"Pontuacao historica: "
                f"{pontuacao_historica:.0f}."
            )

            # Salva a analise no Oracle
            cursor.execute("""
                INSERT INTO ANALISE_RISCO (
                    ID_REGIAO,
                    PONTUACAO_RISCO,
                    NIVEL_RISCO,
                    JUSTIFICATIVA
                )
                VALUES (
                    :id_regiao,
                    :pontuacao,
                    :nivel,
                    :justificativa
                )
            """, {
                "id_regiao": id_regiao,
                "pontuacao": pontuacao_final,
                "nivel": nivel_risco,
                "justificativa": justificativa
            })

            # Exibe o resultado
            print(f"Chuva prevista: {dados['chuva_mm']:.2f} mm")
            print(f"Vento maximo: {dados['vento_maximo']:.2f} km/h")
            print(f"Ocorrencias historicas: {dados['total_ocorrencias']}")

            print("\nPontuacoes:")
            print(f"Chuva: {pontuacao_chuva}")
            print(f"Vento: {pontuacao_vento}")
            print(f"Historico: {pontuacao_historica}")

            print(f"\nPontuacao final: {pontuacao_final}")
            print(f"Nivel de risco: {nivel_risco}\n")

        conexao.commit()

        print("=" * 50)
        print("Analises de risco salvas no Oracle!")
        print("Processamento finalizado!")

    except Exception as erro:

        if conexao:
            conexao.rollback()

        print(f"Erro durante o calculo de risco: {erro}")

    finally:

        if cursor:
            cursor.close()

        if conexao:
            conexao.close()


if __name__ == "__main__":
    executar_calculo()
