from django.urls import path
from contracts.views import contract_index

app_name = 'contracts'

urlpatterns = [
    path('', contract_index, name='index'),
]
