from rest_framework.exceptions import NotFound, PermissionDenied, ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminRole, IsPatientRole, PatientPasswordUsable
from apps.core.clinical import can_view_patient
from apps.core.pagination import paginate_queryset
from apps.patients.bleeding_serializers import BleedingEpisodeCreateSerializer, BleedingEpisodeSerializer
from apps.patients.models import BleedingEpisode, Patient
from apps.patients.views import _flatten_errors


def _episode_queryset():
    return BleedingEpisode.objects.select_related("patient", "hospital", "recorded_by")


class PatientBleedingEpisodesView(APIView):
    permission_classes = [IsAuthenticated, IsAdminRole]

    def get(self, request, patient_id):
        patient = Patient.objects.filter(unique_patient_id__iexact=patient_id.strip()).first()
        if not patient:
            raise NotFound("Patient not found.")
        if not can_view_patient(request.user, patient):
            raise PermissionDenied()
        qs = _episode_queryset().filter(patient=patient)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "episodes": BleedingEpisodeSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )

    def post(self, request, patient_id):
        payload = {**request.data, "patientId": patient_id}
        serializer = BleedingEpisodeCreateSerializer(data=payload, context={"request": request})
        try:
            serializer.is_valid(raise_exception=True)
        except ValidationError as exc:
            return Response({"error": _flatten_errors(exc.detail)}, status=400)
        episode = serializer.save()
        return Response({"episode": BleedingEpisodeSerializer(episode).data}, status=201)


class PatientMeBleedingEpisodesView(APIView):
    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            return Response({"error": "No patient profile linked."}, status=404)
        qs = _episode_queryset().filter(patient=patient)
        rows, next_cursor, limit = paginate_queryset(qs, request)
        return Response(
            {
                "episodes": BleedingEpisodeSerializer(rows, many=True).data,
                "nextCursor": next_cursor,
                "limit": limit,
            }
        )
