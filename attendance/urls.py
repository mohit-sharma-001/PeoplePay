from django.urls import path
from attendance.views import attendance_index

app_name = 'attendance'

urlpatterns = [
    path('', attendance_index, name='index'),
]
