# backend/urls.py (or payments/urls.py)
from django.urls import path
from .views import upi_qr_image
urlpatterns = [
    path('api/upi_qr_image/<int:amount>/', upi_qr_image),
    # ... other routes
]