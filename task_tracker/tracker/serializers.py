from rest_framework import serializers
from .models import User, Task, Category, TaskComment, SubTask, UserProfile


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
        fields = ('id', 'name', 'user', 'created_at')
        read_only_fields = ('user', 'created_at',)

class SubTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTask
        fields = ('id', 'title', 'is_completed', 'task', 'created_at')
        read_only_fields = ('task', 'created_at')

class TaskSerializer(serializers.ModelSerializer):
    subtasks = SubTaskSerializer(many=True, read_only=True)

    class Meta:
        model = Task
        fields = ('id', 'title', 'description', 'status', 'category', 'deadline', 'created_at', 'subtasks')
        read_only_fields = ('created_at', )

class TaskCommentSerializer(serializers.ModelSerializer):
    class Meta:
        model = TaskComment
        fields = ('id', 'text', 'task', 'user', 'created_at')
        read_only_fields = ('user', 'created_at')
