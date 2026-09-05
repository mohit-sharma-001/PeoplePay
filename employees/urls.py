from django.urls import path
from employees.views import employee_index

app_name = 'employees'

urlpatterns = [
    path('', employee_index, name='index'),
]
