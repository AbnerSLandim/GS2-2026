import pathlib
import sys

# Permite `import app...`, `import iot...` e `import processamento...` nos testes.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
