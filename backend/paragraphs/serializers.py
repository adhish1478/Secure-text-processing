from rest_framework import serializers
from .models import Paragraph

class ParagraphSerializer(serializers.ModelSerializer):

    class Meta:
        model= Paragraph
        fields= ['id', 'content', 'word_counts', 'created_at']


class ParagraphSearchSerializer(serializers.ModelSerializer):
    match_count= serializers.SerializerMethodField()

    class Meta:
        model= Paragraph
        fields= ['id', 'content', 'word_counts', 'created_at', 'match_count']

    def get_match_count(self, obj):
        match_counts = self.context.get('match_counts', {})
        return match_counts.get(obj.id, 0)