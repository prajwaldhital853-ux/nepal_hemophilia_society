from django.urls import path

from apps.core.note_views import NoteDetailView, NoteListCreateView, PatientNoteCountsView

urlpatterns = [
    path("<int:pk>/", NoteDetailView.as_view(), name="note-detail"),
    path("patient/<str:target_id>/counts/", PatientNoteCountsView.as_view(), name="patient-note-counts"),
    path("<str:target_type>/<str:target_id>/", NoteListCreateView.as_view(), name="notes"),
]
