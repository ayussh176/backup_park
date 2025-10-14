from django.shortcuts import render
# backend/views.py (or payments/views.py)
import qrcode
from django.http import HttpResponse

def upi_qr_image(request, amount):
    upi_link = f"upi://pay?pa=9359444688@axl&pn=Parking+Payment&am={amount}&cu=INR"
    img = qrcode.make(upi_link)
    response = HttpResponse(content_type="image/png")
    img.save(response, "PNG")
    return response

