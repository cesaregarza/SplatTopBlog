from wagtail.models import Page


class HomePage(Page):
    """Home page model - landing page for the blog."""

    max_count = 1
    subpage_types = ["blog.BlogIndexPage"]

    class Meta:
        verbose_name = "Home Page"
