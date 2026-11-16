"""Testes de sanidade que não precisam de Oracle nem de internet."""
import pathlib
import py_compile

RAIZ = pathlib.Path(__file__).resolve().parent.parent


def test_scripts_python_compilam():
    arquivos = [p for p in RAIZ.rglob("*.py") if ".venv" not in p.parts]
    assert arquivos, "nenhum script Python encontrado"
    for arquivo in arquivos:
        py_compile.compile(str(arquivo), doraise=True)


def test_segredos_fora_do_git():
    gitignore = (RAIZ / ".gitignore").read_text(encoding="utf-8")
    assert ".env" in gitignore


def test_scripts_sql_existem():
    sqls = sorted((RAIZ / "sql").glob("*.sql"))
    assert len(sqls) >= 6
