from django.core.paginator import Paginator
from django.db import models
from wagtail import blocks
from wagtail.admin.panels import FieldPanel
from wagtail.fields import StreamField
from wagtail.images.blocks import ImageChooserBlock
from wagtail.models import Page
from wagtailmarkdown.blocks import MarkdownBlock


class CodeBlock(blocks.StructBlock):
    language = blocks.CharBlock(
        required=False,
        help_text="Language hint for syntax highlighting (e.g. python, js).",
    )
    code = blocks.TextBlock()

    class Meta:
        icon = "code"
        label = "Code"


# Base blocks that can be used both at top-level and inside collapsible sections
BASE_BLOCKS = [
    ("markdown", MarkdownBlock()),
    ("paragraph", blocks.RichTextBlock()),
    ("heading", blocks.CharBlock(form_classname="title")),
    ("image", ImageChooserBlock()),
    ("code", CodeBlock()),
    ("raw_html", blocks.RawHTMLBlock()),
    ("quote", blocks.TextBlock()),
]


class CollapsibleBlock(blocks.StructBlock):
    """A collapsible/spoiler block that can contain any other block types."""

    title = blocks.CharBlock(
        required=True,
        help_text="The summary text shown when collapsed (e.g., 'Click to reveal')",
    )
    open_by_default = blocks.BooleanBlock(
        required=False,
        default=False,
        help_text="If checked, the content will be visible by default",
    )
    content = blocks.StreamBlock(
        BASE_BLOCKS,
        help_text="The content to show when expanded",
    )

    class Meta:
        icon = "collapse-down"
        label = "Collapsible Section"
        template = "blog/blocks/collapsible_block.html"


class BlogIndexPage(Page):
    """Blog listing page."""

    intro = models.TextField(blank=True)

    content_panels = Page.content_panels + [
        FieldPanel("intro"),
    ]

    subpage_types = ["blog.BlogPage"]
    parent_page_types = ["home.HomePage"]

    def get_context(self, request):
        context = super().get_context(request)
        posts = self.get_children().live().specific().order_by("-first_published_at")
        paginator = Paginator(posts, 9)
        page_number = request.GET.get("page")
        page_obj = paginator.get_page(page_number)
        context["posts"] = page_obj
        context["page_obj"] = page_obj
        context["paginator"] = paginator
        context["is_paginated"] = paginator.num_pages > 1
        return context

    class Meta:
        verbose_name = "Blog Index"


class BlogPage(Page):
    """Individual blog post page."""

    date = models.DateField("Post date", null=True, blank=True)
    body = StreamField(
        BASE_BLOCKS + [("collapsible", CollapsibleBlock())],
        blank=True,
        use_json_field=True,
    )

    content_panels = Page.content_panels + [
        FieldPanel("date"),
        FieldPanel("body"),
    ]

    parent_page_types = ["blog.BlogIndexPage"]
    subpage_types = []

    class Meta:
        verbose_name = "Blog Post"
