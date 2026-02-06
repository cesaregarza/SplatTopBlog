from django.http import HttpResponse


def robots_txt(request):
    lines = [
        "User-agent: *",
        "Allow: /",
        "",
        "Sitemap: https://blog.splat.top/sitemap.xml",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")
