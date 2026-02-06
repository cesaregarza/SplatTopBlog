from bleach import clean
from django import template
from django.utils.safestring import mark_safe
from wagtailmarkdown.utils import _get_bleach_kwargs

register = template.Library()


@register.filter(name="sanitize_html")
def sanitize_html(value):
    if not value:
        return ""
    kwargs = dict(_get_bleach_kwargs())
    kwargs["strip"] = True
    kwargs["strip_comments"] = True
    return mark_safe(clean(str(value), **kwargs))
