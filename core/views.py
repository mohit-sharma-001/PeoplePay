from rest_framework.decorators import api_view
from core.utils import api_response


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
                "dashboard"
            ]
        },
        message="PeoplePay 360 REST API Server is running."
    )
