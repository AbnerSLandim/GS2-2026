"""
AlertaClima - MVP / IoT
Simulador de sensores de chuva e vento por regiao.

Gera leituras sinteticas (determinísticas pela semente) no mesmo formato da
tabela DADOS_CLIMATICOS com TIPO_DADO = 'SENSOR'. Os dados sao SIMULADOS:
nao ha hardware real conectado.

Uso:
    python iot/simulador_sensores.py            # so mostra as leituras
    python iot/simulador_sensores.py --gravar   # grava no Oracle (.env)
"""

import argparse
import os
import random
import sys
from datetime import datetime, timedelta

# Perfil de cada regiao: (chuva base mm/h, vento base km/h).
# Valores ilustrativos para a demonstracao.
PERFIS = {
    "Centro": (0.2, 18.0),
    "Mooca": (0.4, 22.0),
    "Ipiranga": (0.6, 26.0),
    "Vila Mariana": (0.3, 20.0),
    "Butantã": (1.2, 34.0),
}


def gerar_leituras(regioes=None, quantidade=24, semente=2026, fim=None):
    """Devolve uma lista de leituras, uma por regiao por hora."""
    regioes = regioes or list(PERFIS)
    fim = fim or datetime.now().replace(minute=0, second=0, microsecond=0)
    aleatorio = random.Random(semente)
    leituras = []

    for regiao in regioes:
        chuva_base, vento_base = PERFIS.get(regiao, (5.0, 20.0))
        for i in range(quantidade):
            momento = fim - timedelta(hours=quantidade - 1 - i)
            chuva = max(0.0, aleatorio.gauss(chuva_base, chuva_base * 0.4))
            vento = max(0.0, aleatorio.gauss(vento_base, vento_base * 0.25))
            leituras.append({
                "NOME_REGIAO": regiao,
                "DATA_REGISTRO": momento,
                "PRECIPITACAO_MM": round(chuva, 2),
                "VELOCIDADE_VENTO": round(vento, 2),
                "TEMPERATURA": round(aleatorio.gauss(22, 2), 1),
                "UMIDADE": round(min(100, max(30, aleatorio.gauss(78, 8))), 1),
                "TIPO_DADO": "SENSOR",
            })
    return leituras


def gravar_no_oracle(leituras):
    """Insere as leituras em DADOS_CLIMATICOS (precisa das regioes cadastradas)."""
    import oracledb
    from dotenv import load_dotenv

    load_dotenv()
    usuario = os.getenv("DB_USER")
    senha = os.getenv("DB_PASSWORD")
    dsn = os.getenv("DB_DSN")
    if not usuario or not senha or not dsn:
        raise ValueError("Verifique DB_USER, DB_PASSWORD e DB_DSN no arquivo .env.")

    conexao = oracledb.connect(user=usuario, password=senha, dsn=dsn)
    try:
        cursor = conexao.cursor()
        cursor.execute("SELECT NOME_REGIAO, ID_REGIAO FROM REGIOES")
        ids = {nome: id_regiao for nome, id_regiao in cursor.fetchall()}

        linhas = [
            {
                "id_regiao": ids[leitura["NOME_REGIAO"]],
                "data_registro": leitura["DATA_REGISTRO"],
                "chuva": leitura["PRECIPITACAO_MM"],
                "vento": leitura["VELOCIDADE_VENTO"],
                "temperatura": leitura["TEMPERATURA"],
                "umidade": leitura["UMIDADE"],
            }
            for leitura in leituras
            if leitura["NOME_REGIAO"] in ids
        ]
        cursor.executemany(
            """
            INSERT INTO DADOS_CLIMATICOS (
                ID_REGIAO, DATA_REGISTRO, PRECIPITACAO_MM,
                VELOCIDADE_VENTO, TEMPERATURA, UMIDADE, TIPO_DADO
            ) VALUES (
                :id_regiao, :data_registro, :chuva,
                :vento, :temperatura, :umidade, 'SENSOR'
            )
            """,
            linhas,
        )
        conexao.commit()
        return len(linhas)
    except Exception:
        conexao.rollback()
        raise
    finally:
        conexao.close()


def main():
    parser = argparse.ArgumentParser(description="Simulador de sensores AlertaClima")
    parser.add_argument("--gravar", action="store_true", help="grava no Oracle")
    parser.add_argument("--horas", type=int, default=24)
    args = parser.parse_args()

    leituras = gerar_leituras(quantidade=args.horas)
    print(f"{len(leituras)} leituras SIMULADAS geradas.")

    if args.gravar:
        total = gravar_no_oracle(leituras)
        print(f"{total} leituras gravadas no Oracle (TIPO_DADO = 'SENSOR').")
    else:
        for leitura in leituras[:5]:
            print(leitura)
        print("... (use --gravar para enviar ao Oracle)")


if __name__ == "__main__":
    sys.exit(main())
