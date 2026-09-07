from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.provinces.models import Province


class ProvinceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        provinces = Province.objects.prefetch_related("districts").all()
        return Response(
            {
                "provinces": [
                    {
                        "name": province.name,
                        "code": province.code,
                        "districts": list(province.districts.values_list("name", flat=True)),
                    }
                    for province in provinces
                ]
            }
        )
