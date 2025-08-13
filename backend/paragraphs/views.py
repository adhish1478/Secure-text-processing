from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.generics import GenericAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .utils import process_paragraphs
from .tasks import async_process_paragraphs, send_daily_user_stats
from .models import Paragraph
from .serializers import ParagraphSerializer, ParagraphSearchSerializer
# Create your views here.

class ParagraphView(APIView):

    permission_classes = [IsAuthenticated]
    def post(self, request):
        raw_input= request.data.get('content', '')
        if not raw_input:
            return Response({"error": "No input provided"}, status=400)
        task= async_process_paragraphs.delay(request.user.id, raw_input)
        return Response({"task_id": task.id}, status=202)

    def get(self, request):
        paragraphs= Paragraph.objects.filter(user= request.user)
        serialzier= ParagraphSerializer(paragraphs, many= True)
        return Response(serialzier.data, status=200)
            

class MatchCountPagination(PageNumberPagination):
    page_size = 10  # Top 10 results per page
    page_size_query_param = 'page_size'
    max_page_size = 50

class ParagraphSearchView(GenericAPIView):
    permission_classes= [IsAuthenticated]
    serializer_class = ParagraphSearchSerializer
    pagination_class = MatchCountPagination


    def get(self, request):
        word= request.query_params.get('word', '')
        if not word:
            return Response({"error": "No search word provided"}, status=400)
        
        # Filter and annotate Paragraphs containing the word
        used_paragraphs= Paragraph.objects.filter(user= request.user)

        # Annotate with match count
        matched= []
        for para in used_paragraphs:
            word_info = para.word_counts.get(word)
            if word_info and word_info.get("count", 0) > 0:
                matched.append((word_info["count"], para))
        matched.sort(key= lambda x: x[0], reverse= True)
        
        paragraphs_only= [para for count, para in matched]
        match_count_map= {para.id : count for count, para in matched}
        position_map = {
            para.id: para.word_counts[word]["positions"]
            for count, para in matched
        }

        # Paginate Results
        page= self.paginate_queryset(paragraphs_only)
        serializer= self.get_serializer(
            page, many= True, context= {'match_counts': match_count_map})
        response_data= serializer.data

        # Add match count manually
        for item in response_data:
            para_id = item['id']
            item['match_count'] = match_count_map.get(para_id, 0)
            item['positions'] = position_map.get(para_id, [])

        return self.get_paginated_response(response_data)
    
