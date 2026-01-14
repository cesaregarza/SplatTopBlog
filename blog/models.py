from django.db import models

from wagtail.models import Page
from wagtail.fields import StreamField
from wagtail.admin.panels import FieldPanel
from wagtail import blocks
from wagtail.images.blocks import ImageChooserBlock

from wagtailmarkdown.blocks import MarkdownBlock


class BlogIndexPage(Page):
    """Blog listing page."""

    intro = models.TextField(blank=True, help_text="Introduction text for the blog")

    content_panels = Page.content_panels + [
        FieldPanel("intro"),
    ]

    subpage_types = ["blog.BlogPage"]
    parent_page_types = ["home.HomePage"]

    def get_context(self, request, *args, **kwargs):
        context = super().get_context(request, *args, **kwargs)
        context["posts"] = (
            BlogPage.objects.live().public().descendant_of(self).order_by("-date")
        )
        return context

    class Meta:
        verbose_name = "Blog Index"


class BlogPage(Page):
    """Individual blog post page."""

    date = models.DateField("Post date")
    intro = models.TextField(
        max_length=500,
        blank=True,
        help_text="Short introduction shown in listings",
    )
    featured_image = models.ForeignKey(
        "wagtailimages.Image",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )

    body = StreamField(
        [
            ("markdown", MarkdownBlock(icon="code")),
            ("paragraph", blocks.RichTextBlock()),
            ("heading", blocks.CharBlock(form_classname="title")),
            ("image", ImageChooserBlock()),
            ("code", blocks.StructBlock([
                ("language", blocks.CharBlock(default="python")),
                ("code", blocks.TextBlock()),
            ], icon="code")),
            ("raw_html", blocks.RawHTMLBlock(icon="code")),
            ("quote", blocks.BlockQuoteBlock()),
        ],
        use_json_field=True,
        blank=True,
    )

    content_panels = Page.content_panels + [
        FieldPanel("date"),
        FieldPanel("intro"),
        FieldPanel("featured_image"),
        FieldPanel("body"),
    ]

    parent_page_types = ["blog.BlogIndexPage"]
    subpage_types = []

    class Meta:
        verbose_name = "Blog Post"
        ordering = ["-date"]
