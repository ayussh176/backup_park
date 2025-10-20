# backend/urls.py (or payments/urls.py)
from django.urls import path
from .views import submit_upi_txn, upi_qr_image
urlpatterns = [
    path('api/upi_qr_image/<int:amount>/', upi_qr_image),
    path('submit-upi-txn/', submit_upi_txn, name='submit_upi_txn'),
    # ... other routes
]