"""
URL configuration for splattopblog project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from wagtail import urls as wagtail_urls
from wagtail.admin import urls as wagtailadmin_urls
from wagtail.documents import urls as wagtaildocs_urls

from blog import views as blog_views

handler404 = "blog.views.custom_404"
handler500 = "blog.views.custom_500"

urlpatterns = [
    path("django-admin/", admin.site.urls),
    path("admin/", include(wagtailadmin_urls)),
    path("documents/", include(wagtaildocs_urls)),
    path("health/", include("health_check.urls")),
    re_path(r"^(?P<page_path>.+)\.md$", blog_views.blog_page_markdown),
    # Wagtail pages - must be last
    path("", include(wagtail_urls)),
]

if settings.DEBUG or settings.SERVE_MEDIA:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
