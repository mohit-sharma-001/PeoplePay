from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class TimeStampedModel(models.Model):
    """
    An abstract base class model that provides self-updating
    `created_at` and `updated_at` fields for all inheriting models.
    """
    created_at = models.DateTimeField(auto_now_add=True, help_text="Timestamp when record was created")
    updated_at = models.DateTimeField(auto_now=True, help_text="Timestamp when record was last updated")

    class Meta:
        abstract = True


class Notification(TimeStampedModel):
    """
    System & Email notification log for users.
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    payslip = models.ForeignKey('payroll.Payslip', on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications')
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=50, default='email')
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({'Read' if self.is_read else 'Unread'})"

