from rest_framework.response import Response
from rest_framework import status


def api_response(data=None, message="Success", status_code=status.HTTP_200_OK, errors=None, success=None):
    """
    Standardized API response helper function for Django REST Framework.
    
    Returns a unified JSON structure:
    {
        "success": true/false,
        "message": "Human readable response description",
        "data": { ... } or [ ... ] or null,
        "errors": { ... } or [ ... ] or null
    }
    """
    if success is None:
        is_success = status.is_success(status_code)
    else:
        is_success = success

    payload = {
        "success": is_success,
        "message": message,
        "data": data if data is not None else {},
        "errors": errors if errors is not None else None,
    }

    return Response(payload, status=status_code)
