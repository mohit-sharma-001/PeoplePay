from rest_framework.decorators import api_view
from core.utils import api_response


@api_view(['GET'])
def attendance_index(request):
    return api_response(data=[], message="Attendance module API skeleton")
