from django.db import models

# Create your models here.
class Payment(models.Model):
    # your fields here
    booking = models.ForeignKey('parking.Booking', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    upi_txn_id = models.CharField(max_length=64, blank=True, null=True)
    status = models.CharField(max_length=32, default='Pending')
    timestamp = models.DateTimeField(auto_now_add=True)