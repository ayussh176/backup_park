from django.db import models
from django.contrib.auth.models import User

class Booking(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    slot_number = models.CharField(max_length=16)
    vehicle_number = models.CharField(max_length=32)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    status = models.CharField(max_length=32, default="upcoming")

    def __str__(self):
        return f"{self.user} - {self.slot_number} ({self.start_time})"
