from django.urls import path
from core.views import (
    api_root_health,
    list_notifications_view,
    mark_all_notifications_read_view,
    mark_notification_read_view,
)

app_name = 'core'

urlpatterns = [
    path('', api_root_health, name='api-health'),
    path('notifications/', list_notifications_view, name='list-notifications'),
    path('notifications/mark-all-read/', mark_all_notifications_read_view, name='mark-all-notifications-read'),
    path('notifications/<int:pk>/read/', mark_notification_read_view, name='mark-notification-read'),
]
