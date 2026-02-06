from django.http import HttpResponse
from wagtail.models import Site


def _site_base_url(request):
    site = Site.find_for_request(request)
    if site and site.root_url:
        return site.root_url.rstrip("/")
    return f"{request.scheme}://{request.get_host()}"


def robots_txt(request):
    base_url = _site_base_url(request)
    lines = [
        "User-agent: *",
        "Allow: /",
        "Disallow: /admin/",
        "Disallow: /django-admin/",
        "Disallow: /documents/",
        "Disallow: /health/",
        "Disallow: /*.md$",
        "",
        f"Sitemap: {base_url}/sitemap.xml",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")
