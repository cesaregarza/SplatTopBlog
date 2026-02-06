import os
from types import SimpleNamespace
from unittest import TestCase
from unittest.mock import Mock, patch

from django.core.exceptions import ValidationError
from django.http import HttpResponse
from django.test import RequestFactory
from wagtail.models import PageViewRestriction

from blog.markdown_extensions.random_choice import RandomChoicePreprocessor
from blog.middleware import FrontendSecurityHeadersMiddleware
from blog.models import AppletEmbedBlock, BlogPage
from blog.robots import robots_txt
from blog.templatetags.blog_sanitize import sanitize_html
from blog.views import _enforce_view_restrictions, _render_block


class TestRobotsTxt(TestCase):
    def test_robots_uses_site_root_and_disallows_sensitive_paths(self):
        request = RequestFactory().get("/robots.txt")
        site = SimpleNamespace(root_url="https://blog.example.com")
        with patch("blog.robots.Site.find_for_request", return_value=site):
            response = robots_txt(request)
        body = response.content.decode("utf-8")
        self.assertIn("Disallow: /admin/", body)
        self.assertIn("Disallow: /health/", body)
        self.assertIn("Disallow: /*.md$", body)
        self.assertIn("Sitemap: https://blog.example.com/sitemap.xml", body)


class TestRandomChoiceDeterminism(TestCase):
    def test_inline_choice_is_stable(self):
        pre = RandomChoicePreprocessor(Mock())
        line = "x [random:red|green|blue] y"
        self.assertEqual(pre.run([line]), pre.run([line]))

    def test_block_choice_is_stable(self):
        pre = RandomChoicePreprocessor(Mock())
        lines = ["[random]", "- alpha", "- beta", "- gamma", "[/random]"]
        self.assertEqual(pre.run(lines), pre.run(lines))


class TestRawHtmlSanitization(TestCase):
    def test_template_filter_strips_script_and_event_handlers(self):
        html = '<script>alert(1)</script><p onclick="alert(1)">Safe</p>'
        output = str(sanitize_html(html))
        self.assertNotIn("<script", output.lower())
        self.assertNotIn("onclick", output.lower())
        self.assertIn(">Safe<", output)

    def test_markdown_export_strips_raw_html_tags(self):
        block = SimpleNamespace(block_type="raw_html", value="<p>Hello <strong>world</strong></p>")
        self.assertEqual(_render_block(block), "Hello world")

    def test_markdown_export_includes_applet_embed_metadata(self):
        block = SimpleNamespace(
            block_type="applet_embed",
            value={
                "title": "Winchart",
                "src": "/static/applets/loser-winner.html",
                "lazy_load": True,
                "max_height": 560,
                "style_overrides": "--applet-frame-height: 560px;",
            },
        )
        output = _render_block(block)
        self.assertIn("Applet", output)
        self.assertIn("title=Winchart", output)
        self.assertIn("src=/static/applets/loser-winner.html", output)
        self.assertIn("lazy_load=true", output)
        self.assertIn("max_height=560", output)


class TestMarkdownRestrictionEnforcement(TestCase):
    def test_login_restriction_returns_redirect(self):
        request = RequestFactory().get("/secret.md")
        page = Mock()
        restriction = Mock()
        restriction.accept_request.return_value = False
        restriction.restriction_type = PageViewRestriction.LOGIN
        page.get_view_restrictions.return_value = [restriction]
        response = _enforce_view_restrictions(request, page)
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 302)

    def test_password_restriction_returns_password_response(self):
        request = RequestFactory().get("/secret.md")
        page = Mock()
        page.id = 123
        restriction = Mock()
        restriction.id = 55
        restriction.accept_request.return_value = False
        restriction.restriction_type = PageViewRestriction.PASSWORD
        page.get_view_restrictions.return_value = [restriction]
        page.serve_password_required_response.return_value = HttpResponse("password")
        with patch("blog.views.PasswordViewRestrictionForm"):
            response = _enforce_view_restrictions(request, page)
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 200)


class TestFrontendSecurityHeadersMiddleware(TestCase):
    def test_frontend_headers_set_on_non_admin_routes(self):
        middleware = FrontendSecurityHeadersMiddleware(lambda request: HttpResponse("ok"))
        request = RequestFactory().get("/blog/post/")
        response = middleware(request)
        self.assertIn("Content-Security-Policy-Report-Only", response)
        self.assertIn("Permissions-Policy", response)

    def test_frontend_headers_skip_admin_routes(self):
        middleware = FrontendSecurityHeadersMiddleware(lambda request: HttpResponse("ok"))
        request = RequestFactory().get("/admin/")
        response = middleware(request)
        self.assertNotIn("Content-Security-Policy-Report-Only", response)
        self.assertNotIn("Content-Security-Policy", response)

    def test_csp_enforce_switch_uses_enforcing_header(self):
        with patch.dict(os.environ, {"CSP_ENFORCE": "true"}):
            middleware = FrontendSecurityHeadersMiddleware(lambda request: HttpResponse("ok"))
            request = RequestFactory().get("/blog/post/")
            response = middleware(request)
        self.assertIn("Content-Security-Policy", response)


class TestBlogPageModelFields(TestCase):
    def test_blogpage_has_featured_image_field(self):
        field_names = {field.name for field in BlogPage._meta.get_fields()}
        self.assertIn("featured_image", field_names)
        self.assertIn("social_image", field_names)


class TestAppletEmbedBlock(TestCase):
    def test_applet_embed_requires_static_applets_prefix(self):
        block = AppletEmbedBlock()
        with self.assertRaises(ValidationError):
            block.clean(
                {
                    "title": "Bad",
                    "src": "https://example.com/applet.html",
                    "lazy_load": True,
                    "max_height": 600,
                    "style_overrides": "",
                }
            )

    def test_applet_embed_accepts_static_applets_path(self):
        block = AppletEmbedBlock()
        cleaned = block.clean(
            {
                "title": "Good",
                "src": "/static/applets/loser-winner.html",
                "lazy_load": False,
                "max_height": 420,
                "style_overrides": "height: 420px;",
            }
        )
        self.assertEqual(cleaned["src"], "/static/applets/loser-winner.html")
        self.assertEqual(cleaned["max_height"], 420)

    def test_applet_embed_uses_default_max_height(self):
        block = AppletEmbedBlock()
        self.assertEqual(block.child_blocks["max_height"].meta.default, 700)

    def test_applet_embed_blank_max_height_stays_unset(self):
        block = AppletEmbedBlock()
        cleaned = block.clean(
            {
                "title": "Auto Height",
                "src": "/static/applets/loser-winner.html",
                "lazy_load": True,
                "max_height": None,
                "style_overrides": "",
            }
        )
        self.assertIsNone(cleaned.get("max_height"))
