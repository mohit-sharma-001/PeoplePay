from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework import status
from core.utils import api_response


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate user with username and password, returning DRF Auth Token
    along with user profile info & assigned group roles.
    """
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return api_response(
            message="Username and password are required.",
            status_code=status.HTTP_400_BAD_REQUEST,
            errors={"credentials": "Username and password must be provided."}
        )

    user = authenticate(username=username, password=password)
    if not user:
        return api_response(
            message="Invalid username or password.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            errors={"authentication": "Unable to log in with provided credentials."}
        )

    if not user.is_active:
        return api_response(
            message="User account is inactive.",
            status_code=status.HTTP_403_FORBIDDEN,
            errors={"account": "This account is inactive."}
        )

    token, _ = Token.objects.get_or_create(user=user)
    roles = list(user.groups.values_list('name', flat=True))

    employee_id = None
    if hasattr(user, 'employee_profile') and user.employee_profile:
        employee_id = user.employee_profile.id

    data = {
        "token": token.key,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_superuser": user.is_superuser,
            "roles": roles,
            "employee_id": employee_id,
        }
    }

    return api_response(
        data=data,
        message="Login successful."
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Invalidate the current user's DRF auth token.
    """
    try:
        request.user.auth_token.delete()
    except Exception:
        pass

    return api_response(
        data={},
        message="Successfully logged out."
    )
