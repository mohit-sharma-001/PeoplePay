"""
URL configuration for peoplepay360_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/employees/', include('employees.urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/working-schedule/', include('working_schedule.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/time-off/', include('time_off.urls')),
    path('api/payroll/', include('payroll.urls')),
    path('api/dashboard/', include('dashboard.urls')),
]
