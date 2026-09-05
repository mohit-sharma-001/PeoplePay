from django.urls import path
from payroll.views import payroll_index

app_name = 'payroll'

urlpatterns = [
    path('', payroll_index, name='index'),
]
