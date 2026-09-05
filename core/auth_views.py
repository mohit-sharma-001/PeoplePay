from datetime import date
from django.contrib.auth.models import User, Group
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from rest_framework import status
from core.utils import api_response
from core.permissions import HasRole
from employees.models import Employee

VALID_SYSTEM_ROLES = ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee']


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


def auto_allocate_leave_types(employee):
    """
    Automatically creates a TimeOffAllocation record for each active TimeOffType
    that requires_allocation=True for a newly registered employee.
    """
    from time_off.models import TimeOffType, TimeOffAllocation
    today = date.today()
    end_of_year = date(today.year, 12, 31)

    requires_alloc_types = TimeOffType.objects.filter(requires_allocation=True)
    for time_off_type in requires_alloc_types:
        name_lower = time_off_type.name.lower()
        if 'sick' in name_lower:
            allocated = 10.0
        elif 'paid' in name_lower or 'annual' in name_lower or 'pto' in name_lower:
            allocated = 20.0
        else:
            allocated = 20.0

        TimeOffAllocation.objects.get_or_create(
            employee=employee,
            time_off_type=time_off_type,
            defaults={
                'allocated_amount': allocated,
                'valid_from': today,
                'valid_until': end_of_year,
                'state': TimeOffAllocation.State.CONFIRMED,
            }
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Public self-registration endpoint. Creates User + Employee record
    and auto-assigns ONLY to 'Employee' group.
    """
    data = request.data or {}
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    phone = data.get('phone', '')
    department = data.get('department')
    job_position = data.get('job_position')

    errors = {}
    if not username:
        errors['username'] = "Username is required."
    if not password:
        errors['password'] = "Password is required."
    if not email:
        errors['email'] = "Email is required."
    if not first_name:
        errors['first_name'] = "First name is required."
    if not last_name:
        errors['last_name'] = "Last name is required."

    if errors:
        return api_response(
            message="Validation error during registration.",
            status_code=status.HTTP_400_BAD_REQUEST,
            errors=errors
        )

    # Uniqueness checks
    if User.objects.filter(username__iexact=username).exists():
        return api_response(
            message="Registration failed.",
            status_code=status.HTTP_400_BAD_REQUEST,
            errors={"username": "Username is already taken."}
        )

    if User.objects.filter(email__iexact=email).exists() or Employee.objects.filter(email__iexact=email).exists():
        return api_response(
            message="Registration failed.",
            status_code=status.HTTP_400_BAD_REQUEST,
            errors={"email": "Email is already registered."}
        )

    # Validate department choice if provided
    valid_departments = [choice[0] for choice in Employee.Department.choices]
    if department and department not in valid_departments:
        department = Employee.Department.ENGINEERING
    elif not department:
        department = Employee.Department.ENGINEERING

    if not job_position:
        job_position = 'Software Engineer'

    # Create User account
    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    # Ensure user is assigned ONLY to 'Employee' group (ignore any privilege escalation attempts)
    employee_group, _ = Group.objects.get_or_create(name='Employee')
    user.groups.set([employee_group])

    # Create linked Employee profile
    employee = Employee.objects.create(
        user=user,
        first_name=first_name,
        last_name=last_name,
        email=email,
        phone=phone,
        department=department,
        job_position=job_position,
        date_joined=date.today(),
        status=Employee.Status.ACTIVE
    )

    # Auto-allocate default time off allocations for newly registered employee
    auto_allocate_leave_types(employee)

    # Generate Auth Token
    token, _ = Token.objects.get_or_create(user=user)

    response_data = {
        "token": token.key,
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "is_superuser": user.is_superuser,
            "roles": list(user.groups.values_list('name', flat=True)),
            "employee_id": employee.id,
        }
    }

    return api_response(
        data=response_data,
        message="User registered successfully.",
        status_code=status.HTTP_201_CREATED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated, HasRole])
def list_users_view(request):
    """
    Admin-only endpoint to list system user accounts.
    Supports filtering by role via `?role=Employee` and employee via `?employee_id=<id>`.
    """
    if not (request.user.is_superuser or request.user.groups.filter(name='Admin').exists()):
        return api_response(
            message="Permission denied.",
            status_code=status.HTTP_403_FORBIDDEN,
            errors={"permission": "Only Admin users can list system user accounts."}
        )

    users = User.objects.all().select_related('employee_profile').prefetch_related('groups').order_by('id')

    role_filter = request.query_params.get('role')
    if role_filter:
        users = users.filter(groups__name__iexact=role_filter)

    employee_id_filter = request.query_params.get('employee_id') or request.query_params.get('employee')
    if employee_id_filter:
        users = users.filter(employee_profile__id=employee_id_filter)

    data = []
    for u in users:
        emp = getattr(u, 'employee_profile', None)
        data.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "first_name": u.first_name,
            "last_name": u.last_name,
            "is_superuser": u.is_superuser,
            "roles": list(u.groups.values_list('name', flat=True)),
            "employee_id": emp.id if emp else None,
            "employee_name": f"{emp.first_name} {emp.last_name}" if emp else None,
        })

    return api_response(
        data=data,
        message="Users retrieved successfully."
    )



list_users_view.allowed_roles = ['Admin']


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, HasRole])
def assign_role_view(request, user_id):
    """
    Admin-only endpoint to reassign a user's group roles.
    Replaces existing group membership entirely.
    """
    if not (request.user.is_superuser or request.user.groups.filter(name='Admin').exists()):
        return api_response(
            message="Permission denied.",
            status_code=status.HTTP_403_FORBIDDEN,
            errors={"permission": "Only Admin users can reassign user roles."}
        )

    user = User.objects.filter(id=user_id).first()
    if not user:
        return api_response(
            message="User not found.",
            status_code=status.HTTP_404_NOT_FOUND,
            errors={"user": f"No user account found with ID {user_id}."}
        )

    roles = request.data.get('roles')
    if roles is None or not isinstance(roles, list):
        return api_response(
            message="Invalid request payload.",
            status_code=status.HTTP_400_BAD_REQUEST,
            errors={"roles": "A list of role names must be provided under key 'roles'."}
        )

    # Validate provided roles against valid system groups
    invalid_roles = [r for r in roles if r not in VALID_SYSTEM_ROLES]
    if invalid_roles:
        return api_response(
            message="Invalid role assignment.",
            status_code=status.HTTP_400_BAD_REQUEST,
            errors={
                "roles": f"Invalid role(s): {', '.join(invalid_roles)}. Valid roles are: {', '.join(VALID_SYSTEM_ROLES)}."
            }
        )

    # Fetch/create groups and replace membership completely
    groups = []
    for role_name in roles:
        grp, _ = Group.objects.get_or_create(name=role_name)
        groups.append(grp)

    user.groups.set(groups)

    emp = getattr(user, 'employee_profile', None)
    data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "roles": list(user.groups.values_list('name', flat=True)),
        "employee_id": emp.id if emp else None,
    }

    return api_response(
        data=data,
        message="User roles updated successfully."
    )


assign_role_view.allowed_roles = ['Admin']

