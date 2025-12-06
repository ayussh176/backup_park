import json
from django.shortcuts import render
# backend/views.py (or payments/views.py)
import qrcode
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from .models import Payment

def upi_qr_image(request, amount):
    upi_link = f"upi://pay?pa=yash48ashwin@oksbi&pn=Parking+Payment&am={amount}&tn=Parking+Slot+Booking&tr=TXN{payment_id}&cu=INR"    img = qrcode.make(upi_link)
    response = HttpResponse(content_type="image/png")
    img.save(response, "PNG")
    return response

@csrf_exempt
def submit_upi_txn(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        payment_id = data.get('payment_id')
        upi_txn_id = data.get('upi_txn_id')
        
        payment = Payment.objects.get(id=payment_id)
        payment.upi_txn_id = upi_txn_id
        payment.status = 'Pending'  # Or 'Under Review'
        payment.save()
        return JsonResponse({'success': True, 'message': 'Txn ID submitted'})
