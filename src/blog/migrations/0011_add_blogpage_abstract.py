from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("blog", "0010_alter_blogpage_body"),
    ]

    operations = [
        migrations.AddField(
            model_name="blogpage",
            name="abstract",
            field=models.TextField(
                blank=True,
                help_text="Optional abstract/summary used for OpenGraph and meta descriptions.",
            ),
        ),
    ]
