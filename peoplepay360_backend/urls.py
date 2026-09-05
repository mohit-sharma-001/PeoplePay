"""
URL configuration for peoplepay360_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from core.auth_views import (
    login_view,
    logout_view,
    register_view,
    list_users_view,
    assign_role_view,
)

urlpatterns = [
    path('', RedirectView.as_view(url='/api/', permanent=False), name='root-redirect'),
    path('admin/', admin.site.urls),
    path('api/auth/login/', login_view, name='api-auth-login'),
    path('api/auth/logout/', logout_view, name='api-auth-logout'),
    path('api/auth/register/', register_view, name='api-auth-register'),
    path('api/auth/users/', list_users_view, name='api-auth-users'),
    path('api/auth/users/<int:user_id>/assign-role/', assign_role_view, name='api-auth-assign-role'),
    path('api/employees/', include('employees.urls')),
    path('api/contracts/', include('contracts.urls')),
    path('api/working-schedule/', include('working_schedule.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/time-off/', include('time_off.urls')),
    path('api/payroll/', include('payroll.urls')),
    path('api/reports/', include('payroll.report_urls')),
    path('api/dashboard/', include('dashboard.urls')),
    path('api/', include('core.urls')),
]
