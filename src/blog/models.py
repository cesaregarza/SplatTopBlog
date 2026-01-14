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
        context["posts"] = (
            self.get_children()
            .live()
            .specific()
            .order_by("-first_published_at")
        )
        return context

    class Meta:
        verbose_name = "Blog Index"


class BlogPage(Page):
    """Individual blog post page."""

    date = models.DateField("Post date", null=True, blank=True)
    body = StreamField(
        [
            ("markdown", MarkdownBlock()),
            ("paragraph", blocks.RichTextBlock()),
            ("heading", blocks.CharBlock(form_classname="title")),
            ("image", ImageChooserBlock()),
            ("code", CodeBlock()),
            ("raw_html", blocks.RawHTMLBlock()),
            ("quote", blocks.TextBlock()),
        ],
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
