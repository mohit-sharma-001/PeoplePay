from django.urls import path
from working_schedule.views import working_schedule_index

app_name = 'working_schedule'

urlpatterns = [
    path('', working_schedule_index, name='index'),
]
