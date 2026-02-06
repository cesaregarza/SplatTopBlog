from django.contrib.syndication.views import Feed
from django.utils.feedgenerator import Atom1Feed

from blog.models import BlogPage


class BlogFeed(Feed):
    title = "SplatTop Blog"
    link = "/blog/"
    description = "Latest posts from the SplatTop Blog"

    def items(self):
        return BlogPage.objects.live().order_by("-first_published_at")[:20]

    def item_title(self, item):
        return item.title

    def item_description(self, item):
        return item.abstract or item.search_description or ""

    def item_link(self, item):
        return item.full_url

    def item_pubdate(self, item):
        return item.first_published_at


class BlogAtomFeed(BlogFeed):
    feed_type = Atom1Feed
    subtitle = BlogFeed.description
