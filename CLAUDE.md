# CLAUDE.md - SplatTop Blog

This file provides guidance for Claude Code when working with the SplatTop Blog codebase.

## Project Overview

SplatTop Blog is a Wagtail CMS-based blog that serves as the companion blog for the SplatTop competitive Splatoon statistics platform. It follows the SplatTop visual design system (dark purple/fuchsia aesthetic).

## Tech Stack

- **Framework**: Django 5.x + Wagtail CMS
- **Database**: PostgreSQL
- **Deployment**: Kubernetes on DigitalOcean
- **Container**: Docker with Gunicorn

## Project Structure

```
SplatTopBlog/
├── blog/                 # Blog app (posts, index)
│   ├── models.py         # BlogPage, BlogIndexPage models
│   └── templates/blog/   # Blog templates
├── home/                 # Home app
│   ├── models.py         # HomePage model
│   └── templates/home/   # Home templates
├── splattopblog/         # Project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── templates/            # Base templates
│   └── base.html         # Main template with SplatTop styles
├── static/               # Static files
├── media/                # User uploads
└── docs/                 # Documentation
    └── SplatTop_style_bible.md  # Design system reference
```

## Code Style

### Python
- Follow PEP 8
- Use type hints where beneficial
- Keep models clean with minimal business logic

### Templates
- Use Wagtail template tags properly
- Maintain semantic HTML
- Keep styles in base.html or separate CSS files

### CSS
- Follow the SplatTop Style Bible (docs/SplatTop_style_bible.md)
- Use CSS custom properties for theming
- Dark backgrounds (#0f172a), purple accents (#ab5ab7)
- Respect `prefers-reduced-motion`

## Key Conventions

1. **StreamField Blocks**: Blog posts use StreamField with markdown, paragraph, heading, image, code, and quote blocks
2. **Image Handling**: Use Wagtail's image tags with appropriate renditions
3. **Security**: Never commit secrets, use environment variables
4. **Accessibility**: Maintain color contrast, support reduced motion

## Common Tasks

### Adding a new block type
1. Define in `blog/models.py` in the `body` StreamField
2. Add template handling in `blog_page.html`
3. Style in `base.html` following style bible

### Running locally
```bash
docker-compose up
```

### Migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

## Review Checklist

When reviewing PRs, check for:
- [ ] No hardcoded secrets or credentials
- [ ] Proper use of Wagtail conventions
- [ ] Template inheritance is correct
- [ ] Styles follow the SplatTop Style Bible
- [ ] Accessibility considerations (contrast, motion)
- [ ] No security vulnerabilities (XSS, SQL injection)
- [ ] Migrations are included if models changed
