from django.urls import path, include
from rest_framework.routers import DefaultRouter
from time_off.views import (
    TimeOffTypeViewSet,
    TimeOffAllocationViewSet,
    TimeOffRequestViewSet,
)

app_name = 'time_off'

router = DefaultRouter()
router.register(r'types', TimeOffTypeViewSet, basename='time-off-types')
router.register(r'allocations', TimeOffAllocationViewSet, basename='time-off-allocations')
router.register(r'requests', TimeOffRequestViewSet, basename='time-off-requests')

urlpatterns = [
    path('', include(router.urls)),
]
