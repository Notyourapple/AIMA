# Python FastAPI + Ollama Container for Render / Production
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (curl and zstd required for Ollama installer & runtime)
RUN apt-get update && apt-get install -y \
    curl \
    zstd \
    procps \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Ollama binary
RUN curl -fsSL https://ollama.com/install.sh | sh

# Install Python backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy dataset and backend codebase
COPY data/ ./data/
COPY backend/ ./backend/

# Make startup script executable
RUN chmod +x /app/backend/start.sh

ENV PORT=8000
ENV OLLAMA_HOST=http://127.0.0.1:11434
ENV OLLAMA_MODEL=qwen2.5:3b

EXPOSE 8000

CMD ["/app/backend/start.sh"]
