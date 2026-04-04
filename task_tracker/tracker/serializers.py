from rest_framework import serializers
from .models import User, Task, Category, TaskComment


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    email = serializers.EmailField()

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ('id', 'name', 'created_at')
        read_only_fields = ('created_at',)

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'status', 'category', 'created_at')
        read_only_fields = ('created_at', )

class TaskCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskComment
        fields = ('id', 'text', 'task', 'user', 'created_at')
        read_only_fields = ('user', 'created_at')
