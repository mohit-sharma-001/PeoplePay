from django.urls import path
from time_off.views import time_off_index

app_name = 'time_off'

urlpatterns = [
    path('', time_off_index, name='index'),
]
