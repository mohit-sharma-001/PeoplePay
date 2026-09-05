from rest_framework import permissions


class HasRole(permissions.BasePermission):
    """
    Custom permission class to check if the authenticated user
    belongs to any of the allowed roles (Django Group names).
    Users in the 'Admin' group and Django superusers ALWAYS pass any permission check.

    Usage on ViewSet:
        permission_classes = [permissions.IsAuthenticated, HasRole]
        allowed_roles = ['Admin', 'HR Manager']

    Or per-action permissions mapping:
        action_allowed_roles = {
            'create': ['Admin', 'HR Manager'],
            'list': ['Admin', 'HR Manager', 'Employee'],
            'approve': ['Admin', 'HR Manager'],
        }
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Rule 2: Admin group members and superusers ALWAYS pass any permission check
        user_groups = set(request.user.groups.values_list('name', flat=True))
        if request.user.is_superuser or 'Admin' in user_groups:
            return True

        # Check per-action allowed roles if defined on view
        action_roles_map = getattr(view, 'action_allowed_roles', None)
        if action_roles_map and hasattr(view, 'action') and view.action in action_roles_map:
            allowed_roles = action_roles_map.get(view.action)
        else:
            allowed_roles = getattr(view, 'allowed_roles', None)
            if not allowed_roles and hasattr(request, 'resolver_match') and request.resolver_match and hasattr(request.resolver_match, 'func'):
                allowed_roles = getattr(request.resolver_match.func, 'allowed_roles', None)

        if not allowed_roles:
            return True

        return any(role in user_groups for role in allowed_roles)


def is_employee_only(user):
    """
    Helper function to check if the requesting user has ONLY the 'Employee' role
    (and lacks Manager/Admin elevated roles).
    """
    if not user or not user.is_authenticated:
        return True
    if user.is_superuser:
        return False
    user_groups = set(user.groups.values_list('name', flat=True))
    elevated_roles = {'Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'}
    return not bool(user_groups.intersection(elevated_roles))
