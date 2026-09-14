import time
from queue import Empty

from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from apps.accounts.permissions import IsPatientRole, PatientPasswordUsable
from apps.core.realtime import subscribe, unsubscribe


class PatientMeEventStreamView(APIView):
    """Server-Sent Events — pushes profile/clinical updates without client polling."""

    permission_classes = [IsAuthenticated, IsPatientRole, PatientPasswordUsable]

    def get(self, request):
        patient = getattr(request.user, "patient_profile", None)
        if not patient:
            return StreamingHttpResponse("event: error\ndata: {}\n\n", content_type="text/event-stream")

        patient_id = patient.unique_patient_id
        queue = subscribe(patient_id)

        def event_stream():
            try:
                yield "event: connected\ndata: {}\n\n"
                while True:
                    try:
                        payload = queue.get(timeout=25)
                        yield f"event: update\ndata: {payload}\n\n"
                    except Empty:
                        yield ": keepalive\n\n"
                    time.sleep(0)
            except GeneratorExit:
                pass
            finally:
                unsubscribe(patient_id, queue)

        response = StreamingHttpResponse(event_stream(), content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response
