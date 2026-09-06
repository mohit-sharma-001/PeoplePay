from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import models
from core.utils import api_response
from core.models import Notification
from payroll.models import Payslip


@api_view(['GET'])
def api_root_health(request):
    """
    Root API health check and version status endpoint.
    """
    return api_response(
        data={
            "app_name": "PeoplePay 360 API",
            "version": "1.0.0",
            "status": "healthy",
            "modules": [
                "employees",
                "contracts",
                "working_schedule",
                "attendance",
                "time_off",
                "payroll",
                "dashboard",
                "notifications"
            ]
        },
        message="PeoplePay 360 REST API Server is running."
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_notifications_view(request):
    """
    Returns list of notifications for the requesting user.
    Auto-populates recent email notifications from payslips if DB is empty.
    """
    user = request.user
    qs = Notification.objects.filter(models.Q(user=user) | models.Q(user__isnull=True)).select_related('payslip')

    if not qs.exists():
        # Auto-generate dynamic notification feed from recent payslips / emails
        payslips = Payslip.objects.select_related('employee', 'payrun').filter(is_excluded=False).order_by('-created_at')[:5]
        for ps in payslips:
            emp = ps.employee
            if emp:
                emp_name = f"{emp.first_name} {emp.last_name}"
                email_addr = emp.email or (emp.user.email if emp.user else 'payroll@peoplepay360.com')
                net_val = float(ps.net) if ps.net else 0.0
                period = f"{ps.date_from} to {ps.date_to}" if (ps.date_from and ps.date_to) else "Pay Period"

                Notification.objects.create(
                    user=user,
                    payslip=ps,
                    title=f"Payslip Email Sent - {emp_name}",
                    message=f"Payslip email delivered to {email_addr} for {period}. Net Pay: ₹{net_val:,.2f}.",
                    notification_type="email",
                    is_read=False
                )
        qs = Notification.objects.filter(models.Q(user=user) | models.Q(user__isnull=True)).select_related('payslip')

    fallback_payslip = Payslip.objects.first()
    fallback_payslip_id = fallback_payslip.id if fallback_payslip else None

    notifications_data = []
    unread_count = 0
    for item in qs[:20]:
        if not item.is_read:
            unread_count += 1
        
        ps_id = item.payslip_id
        if not ps_id and ("payslip" in item.title.lower() or "payslip" in item.message.lower()):
            ps_id = fallback_payslip_id

        notifications_data.append({
            "id": item.id,
            "payslip_id": ps_id,
            "title": item.title,
            "message": item.message,
            "notification_type": item.notification_type,
            "is_read": item.is_read,
            "created_at": item.created_at.isoformat(),
        })

    return api_response(
        data={
            "notifications": notifications_data,
            "unread_count": unread_count,
        },
        message="Notifications retrieved successfully."
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_notifications_read_view(request):
    """
    Marks all notifications for current user as read.
    """
    user = request.user
    Notification.objects.filter(models.Q(user=user) | models.Q(user__isnull=True)).update(is_read=True)
    return api_response(
        data={"unread_count": 0},
        message="All notifications marked as read."
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_notification_read_view(request, pk):
    """
    Marks a single notification as read.
    """
    try:
        notif = Notification.objects.get(pk=pk)
        notif.is_read = True
        notif.save()
        return api_response(data={"id": notif.id, "is_read": True}, message="Notification marked as read.")
    except Notification.DoesNotExist:
        return api_response(message="Notification not found.", status_code=status.HTTP_404_NOT_FOUND)
