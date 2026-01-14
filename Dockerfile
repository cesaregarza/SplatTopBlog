###############################
#         Base Image          #
###############################
FROM python:3.12-slim AS base

WORKDIR /app

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_SYSTEM_PYTHON=1 \
    UV_COMPILE_BYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    libjpeg-dev \
    zlib1g-dev \
    libwebp-dev \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

###############################
#    Install Dependencies     #
###############################
FROM base AS dependencies

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install dependencies (frozen from lockfile)
RUN uv sync --frozen --no-dev --no-install-project

###############################
#        Build Image          #
###############################
FROM dependencies AS build

# Copy project files
COPY . .

# Collect static files
RUN uv run python manage.py collectstatic --noinput --clear

# Create non-root user
RUN useradd -m -u 1000 wagtail && chown -R wagtail:wagtail /app
USER wagtail

EXPOSE 8000

# Run with gunicorn
CMD ["uv", "run", "gunicorn", "--bind", "0.0.0.0:8000", "--workers", "2", "--threads", "4", "splattopblog.wsgi:application"]
