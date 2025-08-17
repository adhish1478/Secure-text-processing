from django.db import models
from django.conf import settings
# Create your models here.

class Paragraph(models.Model):
    user= models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='paragraphs', null=True, blank=True)
    content = models.TextField()
    word_counts= models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

