FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir --user -e ".[dev]"

FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

COPY alembic.ini alembic.ini
COPY alembic/ alembic/
COPY app/ app/

EXPOSE 8000

CMD ["sh", "-c", " \
    alembic upgrade head 2>/dev/null || echo 'Alembic migration skipped'; \
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 \
    "]
