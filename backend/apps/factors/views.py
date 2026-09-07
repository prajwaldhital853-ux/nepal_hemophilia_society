from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import CanManageFactors, IsAdminRole
from apps.factors.models import FactorMedicine
from apps.factors.serializers import FactorMedicineSerializer
from apps.patients.models import Patient


class FactorListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request):
        qs = FactorMedicine.objects.filter(is_active=True).order_by("name")
        hem_type = request.query_params.get("hemophiliaType", "").strip().upper()
        if hem_type in ("A", "B"):
            qs = qs.filter(applicable_type__in=[hem_type, "Both"])
        patient_id = request.query_params.get("patientId", "").strip()
        if patient_id:
            patient = Patient.objects.filter(unique_patient_id__iexact=patient_id).first()
            if patient:
                qs = qs.filter(applicable_type__in=[patient.hemophilia_type, "Both"])
        return Response({"factors": FactorMedicineSerializer(qs, many=True).data})


class FactorAdminView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole, CanManageFactors]

    def post(self, request):
        serializer = FactorMedicineSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        factor = serializer.save()
        return Response({"factor": FactorMedicineSerializer(factor).data}, status=201)
