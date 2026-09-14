from django.urls import path

from apps.stock.views import (
    PatientMeStockView,
    StockDetailView,
    StockInView,
    StockListCreateView,
    StockMovementListView,
    StockOutView,
)

urlpatterns = [
    path("", StockListCreateView.as_view(), name="stock-list"),
    path("movements/", StockMovementListView.as_view(), name="stock-movements"),
    path("<int:pk>/", StockDetailView.as_view(), name="stock-detail"),
    path("<int:pk>/in/", StockInView.as_view(), name="stock-in"),
    path("<int:pk>/out/", StockOutView.as_view(), name="stock-out"),
]
