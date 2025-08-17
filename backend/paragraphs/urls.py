from django.urls import path
from .views import ParagraphView, ParagraphSearchView

urlpatterns = [
    path('paragraphs/', ParagraphView.as_view(), name='paragraph-list'),
    path('paragraphs/search/', ParagraphSearchView.as_view(), name='paragraph-search'),
]