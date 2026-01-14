.PHONY: help install dev migrate shell superuser static clean docker-up docker-down

help:  ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

install:  ## Install dependencies
	uv sync

dev:  ## Run development server
	uv run python manage.py runserver

migrate:  ## Run database migrations
	uv run python manage.py migrate

makemigrations:  ## Create new migrations
	uv run python manage.py makemigrations

shell:  ## Open Django shell
	uv run python manage.py shell

superuser:  ## Create superuser
	uv run python manage.py createsuperuser

static:  ## Collect static files
	uv run python manage.py collectstatic --noinput

clean:  ## Clean up cache files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	rm -rf .pytest_cache .mypy_cache .coverage htmlcov 2>/dev/null || true

# Docker commands
docker-up:  ## Start Docker containers
	docker-compose up -d

docker-down:  ## Stop Docker containers
	docker-compose down

docker-logs:  ## View Docker logs
	docker-compose logs -f

docker-build:  ## Rebuild Docker image
	docker-compose build --no-cache

# Initial setup
setup: install  ## Initial project setup
	@if [ ! -f .env ]; then cp .env.local .env; echo "Created .env from .env.local"; fi
	uv run python manage.py migrate
	@echo ""
	@echo "Setup complete! Run 'make dev' to start the server."
	@echo "Visit http://localhost:8000/admin/ to access the admin."
	@echo "Run 'make superuser' to create an admin account."
