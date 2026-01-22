from django.http import Http404, HttpResponse
from django.utils.html import strip_tags
from wagtail.models import Site

from .models import BlogPage


def _escape_tag_value(value):
    if value is None:
        return ""
    text = str(value)
    return text.replace("\\", "\\\\").replace(";", "\\;").replace("]", "\\]")


def _struct_value_get(value, key, default=None):
    getter = getattr(value, "get", None)
    if callable(getter):
        try:
            return getter(key, default)
        except TypeError:
            pass
    if hasattr(value, key):
        return getattr(value, key)
    try:
        return value[key]
    except Exception:
        return default


def _html_to_text(html):
    if not html:
        return ""
    text = strip_tags(html)
    return text.strip()


def _render_block(block):
    block_type = block.block_type
    value = block.value

    if block_type == "markdown":
        return str(value).strip()

    if block_type == "paragraph":
        html = getattr(value, "source", None)
        if html is None:
            html = str(value)
        return _html_to_text(html)

    if block_type == "heading":
        return f"## {_escape_tag_value(value)}"

    if block_type == "image":
        url = getattr(getattr(value, "file", None), "url", "")
        alt = getattr(value, "title", "") or ""
        alt = _escape_tag_value(alt)
        if url:
            return f"![{alt}]({url})"
        return ""

    if block_type == "code":
        language = _struct_value_get(value, "language", "") or ""
        code = _struct_value_get(value, "code", "") or ""
        return f"```{language}\n{code}\n```"

    if block_type == "raw_html":
        return str(value).strip()

    if block_type == "quote":
        text = str(value).strip()
        if not text:
            return ""
        return "\n".join(f"> {line}" if line else ">" for line in text.splitlines())

    if block_type == "collapsible":
        title = _escape_tag_value(_struct_value_get(value, "title", ""))
        category = _struct_value_get(value, "category", "") or "default"
        default_closed = "true" if not _struct_value_get(value, "open_by_default", False) else "false"
        inner = _render_blocks(_struct_value_get(value, "content", []))
        header = (
            f"[collapsible; title={title}; category={category}; "
            f"default_closed={default_closed}]"
        )
        footer = "[/collapsible]"
        if inner:
            return f"{header}\n{inner}\n{footer}"
        return f"{header}\n{footer}"

    return ""


def _render_blocks(blocks):
    parts = []
    for block in blocks:
        rendered = _render_block(block)
        if rendered:
            parts.append(rendered)
    return "\n\n".join(parts)


def blog_page_markdown(request, page_path):
    site = Site.find_for_request(request)
    if not site:
        raise Http404

    path_components = [component for component in page_path.split("/") if component]
    try:
        route_result = site.root_page.route(request, path_components)
    except Http404:
        raise

    page = getattr(route_result, "page", None)
    if page is None and isinstance(route_result, tuple):
        page = route_result[0]

    if page is None:
        raise Http404

    specific = page.specific
    if not isinstance(specific, BlogPage):
        raise Http404

    body = _render_blocks(specific.body)
    title = specific.title or ""
    date = specific.date.isoformat() if specific.date else ""

    lines = []
    if title:
        lines.append(f"# {title}")
    if date:
        lines.append(f"*{date}*")
    if body:
        if lines:
            lines.append("")
        lines.append(body)

    content = "\n".join(lines).strip() + "\n"

    return HttpResponse(content, content_type="text/markdown; charset=utf-8")
