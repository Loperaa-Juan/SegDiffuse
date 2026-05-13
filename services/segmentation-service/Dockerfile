# --- Stage 1: Build ---
# Uses the CUDA devel image.
FROM nvidia/cuda:12.1.0-cudnn8-devel-ubuntu22.04 AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-venv \
    python3.11-dev \
    python3-pip \
    build-essential \
    ninja-build \
    git \
    && rm -rf /var/lib/apt/lists/*

RUN python3.11 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .

RUN pip install --no-cache-dir --upgrade pip


RUN pip install --no-cache-dir \
    --extra-index-url https://download.pytorch.org/whl/cu121 \
    torch torchvision torchaudio


RUN pip install --no-cache-dir -r requirements.txt


RUN pip install --no-cache-dir wheel setuptools && \
    pip install --no-cache-dir --no-build-isolation 'git+https://github.com/facebookresearch/detectron2.git'

    

RUN find /opt/venv/lib/python3.11/site-packages -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true && \
    find /opt/venv/lib/python3.11/site-packages -type f -name "*.pyc" -delete && \
    find /opt/venv/lib/python3.11/site-packages -type f -name "*.pyo" -delete && \
    find /opt/venv/lib/python3.11/site-packages -type d -name "tests" -exec rm -r {} + 2>/dev/null || true && \
    find /opt/venv/lib/python3.11/site-packages -type d -name "test" -exec rm -r {} + 2>/dev/null || true && \
    find /opt/venv/lib/python3.11/site-packages -type d -name "*.egg-info" -exec rm -r {} + 2>/dev/null || true && \
    find /opt/venv/lib/python3.11/site-packages -type d -name "*.dist-info" -exec find {} -name "*.txt" ! -name "METADATA" ! -name "RECORD" -delete \; 2>/dev/null || true && \
    find /opt/venv/lib/python3.11/site-packages -type f -name "*.so" -exec strip --strip-debug {} \; 2>/dev/null || true

# --- Stage 2: Runtime ---
FROM nvidia/cuda:12.1.0-cudnn8-runtime-ubuntu22.04 AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    DEBIAN_FRONTEND=noninteractive \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && rm -rf /tmp/* /var/tmp/*

COPY --from=builder /opt/venv /opt/venv

COPY . .

RUN find . -type d -name "__pycache__" -exec rm -r {} + 2>/dev/null || true && \
    find . -type f -name "*.pyc" -delete && \
    find . -type f -name "*.pyo" -delete

EXPOSE 8080

CMD ["sh", "-c", "uvicorn src.server.app:app --host 0.0.0.0 --port ${PORT:-8080}"]
