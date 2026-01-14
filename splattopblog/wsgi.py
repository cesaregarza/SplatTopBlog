"""
WSGI config for splattopblog project.
"""

import os

from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "splattopblog.settings")

application = get_wsgi_application()
