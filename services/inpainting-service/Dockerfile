# --- Stage 1: Build ---
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir \
        --extra-index-url https://download.pytorch.org/whl/cu121 \
        -r requirements.txt

RUN find /usr/local/lib/python3.11/site-packages -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11/site-packages -type f -name "*.pyc" -delete && \
    find /usr/local/lib/python3.11/site-packages -type f -name "*.pyo" -delete && \
    find /usr/local/lib/python3.11/site-packages -type d -name "tests" -exec rm -r {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11/site-packages -type d -name "test" -exec rm -r {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11/site-packages -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true && \
    find /usr/local/lib/python3.11/site-packages -type d -name "*.dist-info" -exec find {} -name "*.txt" ! -name "METADATA" ! -name "RECORD" -delete \; 2>/dev/null || true && \
    find /usr/local/lib/python3.11/site-packages -type f -name "*.so" -exec strip {} \; 2>/dev/null || true

# --- Stage 2: Runtime ---
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /tmp/* /var/tmp/*

COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

RUN find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true && \
    find . -type f -name "*.pyc" -delete && \
    find . -type f -name "*.pyo" -delete

EXPOSE 8080

CMD ["sh", "-c", "uvicorn src.server.app:app --host 0.0.0.0 --port ${PORT:-8080}"]
