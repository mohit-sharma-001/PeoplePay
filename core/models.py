from django.db import models


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    `created_at` and `updated_at` fields for all inheriting models.
    """
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when record was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="Timestamp when record was last updated")

    class Meta:
        abstract = True
