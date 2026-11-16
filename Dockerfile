FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Credenciais do Oracle entram só por variáveis de ambiente (DB_USER, DB_PASSWORD, DB_DSN).
# Nunca copiar o .env para a imagem (ver .dockerignore).
EXPOSE 8501
CMD ["streamlit", "run", "app/main.py", "--server.address=0.0.0.0", "--server.port=8501"]
