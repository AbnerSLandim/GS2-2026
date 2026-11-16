import pathlib
import sys

import dotenv

# Os testes nunca podem ler um .env real (poderia apontar para o Oracle de verdade).
dotenv.load_dotenv = lambda *args, **kwargs: False

# Permite `import app...`, `import iot...` e `import processamento...` nos testes.
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
