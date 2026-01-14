# SplatTop Blog

Wagtail-powered blog for blog.splat.top.

## Local Development

```bash
# Start services
docker compose up -d

# Create migrations
docker compose exec web python manage.py makemigrations

# Create superuser
docker compose exec web python manage.py createsuperuser

# Access the site
open http://localhost:8000        # Frontend
open http://localhost:8000/admin  # Wagtail admin
```

## Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `DJANGO_SECRET_KEY` | Django secret key |
| `DEBUG` | Enable debug mode (true/false) |
| `ALLOWED_HOSTS` | Comma-separated list of hosts |
| `SQL_HOST` | PostgreSQL host |
| `SQL_PORT` | PostgreSQL port |
| `SQL_DATABASE` | Database name |
| `SQL_USER` | Database user |
| `SQL_PASSWORD` | Database password |

## Blog Features

- **Markdown blocks** with syntax highlighting
- **Rich text** editing
- **Raw HTML** for embeds
- **Image** uploads
- **Code blocks** with language support

## Production Deployment

Build and push the Docker image, then deploy via Kubernetes/Helm.
