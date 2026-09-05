from rest_framework.decorators import api_view
from core.utils import api_response


@api_view(['GET'])
def time_off_index(request):
    return api_response(data=[], message="Time Off module API skeleton")
