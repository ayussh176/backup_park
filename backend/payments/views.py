import json
import time
import qrcode

from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Payment


def upi_qr_image(request, amount):
    upi_link = (
        f"upi://pay?"
        f"pa=yash48ashwin@oksbi&"
        f"pn=Parking+Payment&"
        f"am={amount}&"
        f"tn=Parking+Slot+Booking&"
        f"tr=TXN{int(time.time())}&"
        f"cu=INR"
    )

    # Generate QR image
    img = qrcode.make(upi_link)

    # Return image as PNG
    response = HttpResponse(content_type="image/png")
    img.save(response, "PNG")
    return response


@csrf_exempt
def submit_upi_txn(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        payment_id = data.get('payment_id')
        upi_txn_id = data.get('upi_txn_id')

        try:
            payment = Payment.objects.get(id=payment_id)
        except Payment.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Invalid Payment ID'}, status=400)

        payment.upi_txn_id = upi_txn_id
        payment.status = 'Pending'  # or "Under Review"
        payment.save()

        return JsonResponse({'success': True, 'message': 'Txn ID submitted'})

    return JsonResponse({'error': 'Invalid request method'}, status=405)
