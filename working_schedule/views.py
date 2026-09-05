from rest_framework.decorators import api_view
from core.utils import api_response


@api_view(['GET'])
def working_schedule_index(request):
    return api_response(data=[], message="Working Schedule module API skeleton")
