"""
AlertaClima - monta o .zip de entrega da Global Solution.

Inclui todo o codigo versionado no Git (sem .env, .venv e caches), os PDFs
de docs/ e entrega/integrantes.txt. Avisa se o .txt ainda tem campos
<PREENCHER>.

Uso:  python entrega/montar_zip.py
"""

import pathlib
import subprocess
import sys
import zipfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "entrega" / "GS2_2026_AlertaClima.zip"
PROIBIDOS = (".env",)


def arquivos_versionados():
    saida = subprocess.run(
        ["git", "ls-files"], cwd=RAIZ, capture_output=True, text=True, check=True
    ).stdout
    return [RAIZ / linha for linha in saida.splitlines() if linha]


def main():
    arquivos = arquivos_versionados()
    for nome in PROIBIDOS:
        if any(a.name == nome for a in arquivos):
            sys.exit(f"ERRO: {nome} esta versionado. Remova antes de entregar.")

    txt = RAIZ / "entrega" / "integrantes.txt"
    pendente = "<PREENCHER" in txt.read_text(encoding="utf-8")

    with zipfile.ZipFile(DESTINO, "w", zipfile.ZIP_DEFLATED) as z:
        for arquivo in arquivos:
            if arquivo.exists() and arquivo != DESTINO:
                z.write(arquivo, arquivo.relative_to(RAIZ))

    print(f"ZIP gerado: {DESTINO} ({len(arquivos)} arquivos)")
    if pendente:
        print("ATENCAO: entrega/integrantes.txt ainda tem campos <PREENCHER>.")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
