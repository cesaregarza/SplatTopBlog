# SplatTop Blog

Wagtail-powered blog for blog.splat.top.

## Quick Start (Local Development)

```bash
# Install uv if you haven't already
curl -LsSf https://astral.sh/uv/install.sh | sh

# Setup project (installs deps, creates .env, runs migrations)
make setup

# Create admin account
make superuser

# Run development server
make dev

# Visit the site
open http://localhost:8000        # Frontend
open http://localhost:8000/admin  # Wagtail admin
```

## Available Commands

```bash
make help          # Show all commands
make install       # Install dependencies
make dev           # Run dev server
make migrate       # Run migrations
make makemigrations # Create migrations
make shell         # Django shell
make superuser     # Create admin user
make static        # Collect static files
make clean         # Clean cache files
```

## Docker Development

If you prefer Docker (uses PostgreSQL):

```bash
make docker-up     # Start containers
make docker-logs   # View logs
make docker-down   # Stop containers
```

## Environment Variables

The project uses `.env` for configuration. Copy `.env.local` to get started:

```bash
cp .env.local .env
```

| Variable | Description | Default |
|----------|-------------|---------|
| `DEBUG` | Enable debug mode | `true` |
| `DJANGO_SECRET_KEY` | Django secret key | (required in prod) |
| `ALLOWED_HOSTS` | Comma-separated hosts | `localhost,127.0.0.1` |
| `SQL_HOST` | PostgreSQL host | (empty = SQLite) |
| `SQL_PORT` | PostgreSQL port | `5432` |
| `SQL_DATABASE` | Database name | `splattopblog` |
| `SQL_USER` | Database user | `postgres` |
| `SQL_PASSWORD` | Database password | |

**Note:** When `SQL_HOST` is not set, the app uses SQLite (`db.sqlite3`), which is perfect for local development.

## Blog Features

- **Markdown blocks** with syntax highlighting
- **Rich text** editing
- **Raw HTML** for embeds
- **Image** uploads with Wagtail image processing
- **Code blocks** with language support
- **Quote blocks**

## Project Structure

```
splattopblog/
├── blog/                 # Blog app (posts, index)
├── home/                 # Home page app
├── splattopblog/         # Project settings
├── templates/            # Base templates
├── static/               # Static assets
├── media/                # User uploads
└── docs/                 # Documentation
    └── SplatTop_style_bible.md
```

## Production Deployment

Push to `main` triggers the CI/CD pipeline:
1. Builds Docker image → DigitalOcean Container Registry
2. Creates PR to update Helm values in SplatTopConfig
3. ArgoCD syncs deployment to Kubernetes
