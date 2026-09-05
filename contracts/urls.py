from django.urls import path, include
from rest_framework.routers import DefaultRouter
from contracts.views import ContractViewSet

app_name = 'contracts'

router = DefaultRouter()
router.register(r'', ContractViewSet, basename='contract')

urlpatterns = [
    path('', include(router.urls)),
]
