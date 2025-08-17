from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Paragraph
from django.contrib.auth import get_user_model
from .utils import process_paragraphs, tokenize_with_positions
import logging
from collections import defaultdict, Counter

logger= logging.getLogger(__name__)

@shared_task(bind= True, autoretry_for=(Exception,), retry_backoff=True)
def async_process_paragraphs(self, user_id, raw_input):
    """
    Asynchronously processes paragraphs for a user with retry logic.
    """
    User = get_user_model()
    try:
        user= User.objects.get(id= user_id)
        return {
            'status': 'success',
            'result': [p.id for p in process_paragraphs(user, raw_input)]
        }
    except Exception as e:
        logger.error(f"Error processing paragraphs for user {user_id}: {e}")
        raise self.retry(exc=e)
    

@shared_task
def send_daily_user_stats():
    """
    Sends daily writing stats to all active users.
    """
    today = timezone.now().date()
    User = get_user_model()
    for user in User.objects.filter(is_active=True):
        paragraphs = user.paragraphs.filter(created_at__date=today)
        
        # Aggregate all words
        word_counter = Counter()
        total_words = 0

        for p in paragraphs:
            for word, data in p.word_counts.items():
                count = data.get("count", 0)
                word_counter[word] += count
                total_words += count

        most_common_words = word_counter.most_common(5)
        common_word_str = ", ".join([f"{word} ({count})" for word, count in most_common_words]) or "None"

        email_content = f"""
Daily Writing Report for {today}:

- Paragraphs Written: {paragraphs.count()}
- Total Words: {total_words}
- Most Used Words: {common_word_str}
"""

        send_mail(
            subject=f"Your Daily Writing Stats - {today}",
            message=email_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )