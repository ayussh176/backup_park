from django.db import models

class User(models.Model):
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    # Add other fields as needed

    def __str__(self):
        return self.username
