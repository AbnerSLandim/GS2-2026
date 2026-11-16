FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Roda sem privilegios de root.
RUN useradd --create-home --uid 10001 appuser && chown -R appuser /app
USER appuser

# Credenciais do Oracle e APP_SENHA_HASH entram so por variaveis de ambiente.
# Nunca copiar o .env para a imagem (ver .dockerignore).
EXPOSE 8501
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8501/_stcore/health', timeout=3)"

CMD ["streamlit", "run", "app/main.py", "--server.address=0.0.0.0", "--server.port=8501"]
