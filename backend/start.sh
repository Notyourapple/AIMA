#!/bin/sh
set -e

echo "=================================================="
echo "🚀 Starting AI Marketplace Assistant (AIMA)..."
echo "=================================================="

OLLAMA_HOST_URL="${OLLAMA_HOST:-http://127.0.0.1:11434}"
OLLAMA_MODEL_NAME="${OLLAMA_MODEL:-qwen2.5:3b}"
APP_PORT="${PORT:-8000}"

# 1. Start Ollama daemon in background if enabled
if [ "${OLLAMA_ENABLED:-true}" = "true" ]; then
    echo "📦 Initializing Ollama daemon in background..."
    ollama serve &
    OLLAMA_PID=$!

    # Wait for Ollama service to respond
    echo "⏳ Waiting for Ollama service to become ready..."
    MAX_WAIT=20
    WAITED=0
    until curl -s "${OLLAMA_HOST_URL}/api/tags" > /dev/null 2>&1 || [ $WAITED -ge $MAX_WAIT ]; do
        sleep 1
        WAITED=$((WAITED + 1))
    done

    if [ $WAITED -lt $MAX_WAIT ]; then
        echo "✅ Ollama is online and listening on ${OLLAMA_HOST_URL}"

        # Check if the target model is present
        echo "🔍 Checking for model: ${OLLAMA_MODEL_NAME}..."
        if ollama list | grep -q "${OLLAMA_MODEL_NAME}"; then
            echo "✅ Model '${OLLAMA_MODEL_NAME}' is already installed."
        else
            echo "📥 Pulling Ollama model '${OLLAMA_MODEL_NAME}' (this may take a couple minutes on initial boot)..."
            ollama pull "${OLLAMA_MODEL_NAME}" || echo "⚠️ Warning: Failed to pull ${OLLAMA_MODEL_NAME}. Continuing to start FastAPI..."
        fi
    else
        echo "⚠️ Warning: Ollama did not respond within ${MAX_WAIT}s. Proceeding to launch FastAPI..."
    fi
else
    echo "ℹ️ Ollama is disabled via OLLAMA_ENABLED=false."
fi

# 2. Start FastAPI Server
echo "🌐 Starting FastAPI on 0.0.0.0:${APP_PORT}..."
exec uvicorn backend.main:app --host 0.0.0.0 --port "${APP_PORT}"
