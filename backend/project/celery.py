import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')

app= Celery('project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()


# Scheduled Tasks

app.conf.beat_schedule ={
    'send_daily_user_stats': {
        'task': 'paragraphs.tasks.send_daily_user_stats',
        'schedule': crontab(hour=22, minute=46), # Every day at 22:13
    },
}