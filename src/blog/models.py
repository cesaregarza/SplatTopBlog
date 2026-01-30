from django.core.paginator import Paginator
from django.db import models
from wagtail import blocks
from wagtail.admin.panels import FieldPanel
from wagtail.fields import StreamField
from wagtail.images.blocks import ImageChooserBlock
from wagtail.models import Page
from wagtailmarkdown.blocks import MarkdownBlock

from .post_processing import render_blog_body

class CodeBlock(blocks.StructBlock):
    language = blocks.CharBlock(
        required=False,
        help_text="Language hint for syntax highlighting (e.g. python, js).",
    )
    code = blocks.TextBlock()

    class Meta:
        icon = "code"
        label = "Code"


class ImageBlock(blocks.StructBlock):
    image = ImageChooserBlock(required=True)
    caption = blocks.CharBlock(
        required=False,
        help_text="Optional caption shown under the image.",
    )

    def bulk_to_python(self, values):
        normalized = []
        for value in values:
            if value is None or isinstance(value, dict):
                normalized.append(value)
            else:
                normalized.append({"image": value, "caption": ""})
        return super().bulk_to_python(normalized)

    def to_python(self, value):
        if value is None:
            return super().to_python({"image": None, "caption": ""})
        if isinstance(value, dict):
            return super().to_python(value)
        # Backwards-compatibility: previous ImageChooserBlock value.
        return super().to_python({"image": value, "caption": ""})

    class Meta:
        icon = "image"
        label = "Image"


class GlossaryTermBlock(blocks.StructBlock):
    term = blocks.CharBlock(required=True)
    definition = blocks.TextBlock(required=True)
    aliases = blocks.CharBlock(
        required=False,
        help_text="Optional aliases (comma-separated).",
    )

    class Meta:
        icon = "help"
        label = "Glossary Term"


class GlossaryBlock(blocks.StructBlock):
    terms = blocks.ListBlock(GlossaryTermBlock(), help_text="Glossary terms for this post.")
    auto_link = blocks.BooleanBlock(
        required=False,
        default=False,
        help_text="Auto-link matching terms in the post body.",
    )
    show_list = blocks.BooleanBlock(
        required=False,
        default=False,
        help_text="Show a glossary list at this position.",
    )

    class Meta:
        icon = "list-ul"
        label = "Glossary"


class KeyTakeawayBlock(blocks.StructBlock):
    title = blocks.CharBlock(required=False, help_text="Optional label (e.g. Key takeaway).")
    color = blocks.ChoiceBlock(
        required=False,
        default="blue",
        choices=[
            ("blue", "Blue"),
            ("purple", "Purple"),
            ("pink", "Pink"),
            ("gold", "Gold"),
        ],
        help_text="Accent color for the callout.",
    )
    body = MarkdownBlock(required=True)

    class Meta:
        icon = "success"
        label = "Key Takeaway"


# Base blocks that can be used both at top-level and inside collapsible sections
BASE_BLOCKS = [
    ("markdown", MarkdownBlock()),
    ("paragraph", blocks.RichTextBlock()),
    ("heading", blocks.CharBlock(form_classname="title")),
    ("image", ImageBlock()),
    ("code", CodeBlock()),
    ("raw_html", blocks.RawHTMLBlock()),
    ("quote", blocks.TextBlock()),
    ("glossary", GlossaryBlock()),
    ("takeaway", KeyTakeawayBlock()),
]


class CollapsibleBlock(blocks.StructBlock):
    """A collapsible/spoiler block that can contain any other block types."""

    category = blocks.ChoiceBlock(
        required=False,
        default="",
        choices=[
            ("", "Default"),
            ("explainer", "Explainer"),
            ("technical", "Technical"),
            ("extra", "Extra"),
            ("subquest", "Side Quest"),
        ],
        help_text="Optional category to color-code the collapsible.",
    )
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

    def get_context(self, request):
        context = super().get_context(request)
        context.update(render_blog_body(self.body))
        return context

    class Meta:
        verbose_name = "Blog Post"
