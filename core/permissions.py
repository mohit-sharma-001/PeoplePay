from rest_framework import permissions


class HasRole(permissions.BasePermission):
    """
    Custom permission class to check if the authenticated user
    belongs to any of the allowed roles (Django Group names).
    
    Usage on View/ViewSet:
        permission_classes = [permissions.IsAuthenticated, HasRole]
        allowed_roles = ['Admin', 'HR Manager']
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Superusers always have full access
        if request.user.is_superuser:
            return True

        allowed_roles = getattr(view, 'allowed_roles', None)
        if not allowed_roles:
            return True

        user_groups = set(request.user.groups.values_list('name', flat=True))
        return any(role in user_groups for role in allowed_roles)
