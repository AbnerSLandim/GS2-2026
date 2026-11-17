# ---------- 1) build do site (React + Vite) ----------
FROM node:20-slim AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# ---------- 2) API (FastAPI) servindo o site ----------
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=web /web/dist ./web/dist

# Roda sem privilegios de root.
RUN useradd --create-home --uid 10001 appuser && chown -R appuser /app
USER appuser

# APP_SENHA_HASH, APP_SECRET e credenciais do Oracle entram so por variaveis de ambiente.
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD python -c "import urllib.request as u; u.urlopen('http://localhost:8000/api/saude', timeout=3)"

CMD ["python", "-m", "uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
