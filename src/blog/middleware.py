import os


class FrontendSecurityHeadersMiddleware:
    """Attach additional frontend security headers without impacting Wagtail admin."""

    def __init__(self, get_response):
        self.get_response = get_response
        self.enforce_csp = os.environ.get("CSP_ENFORCE", "false").strip().lower() in {
            "1",
            "true",
            "yes",
            "on",
        }

    def __call__(self, request):
        response = self.get_response(request)
        if self._is_admin_path(request.path):
            return response

        csp_header = "Content-Security-Policy" if self.enforce_csp else "Content-Security-Policy-Report-Only"
        csp_directives = [
            "default-src 'self'",
            "base-uri 'self'",
            "object-src 'none'",
            "frame-ancestors 'self'",
            "img-src 'self' data: https:",
            "font-src 'self' data: https://cdn.jsdelivr.net",
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
            "script-src 'self' https://cdn.jsdelivr.net",
            "connect-src 'self'",
            "form-action 'self'",
        ]
        if self.enforce_csp:
            csp_directives.append("upgrade-insecure-requests")
        csp_policy = "; ".join(csp_directives)
        response.setdefault(csp_header, csp_policy)
        response.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
        return response

    @staticmethod
    def _is_admin_path(path):
        return path.startswith("/admin/") or path.startswith("/django-admin/")
