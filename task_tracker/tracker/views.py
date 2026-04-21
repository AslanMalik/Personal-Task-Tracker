from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Task, TaskComment, Category, User
from .serializers import LoginSerializer, RegisterSerializer, TaskSerializer, TaskCommentSerializer, CategorySerializer




@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        if User.objects.filter(username=serializer.validated_data['username']).exists():
            return Response({'error': 'Username already taken'}, status=400)
        user = User.objects.create_user(
            username=serializer.validated_data['username'],
            password=serializer.validated_data['password'],
            email=serializer.validated_data['email'],
        )
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=201)
    return Response(serializer.errors, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serialize = LoginSerializer(data=request.data)
    if serialize.is_valid():
        user = authenticate(
            username=serialize.validated_data['username'],
            password=serialize.validated_data['password']
        )

        if user:
            refresh = RefreshToken.for_user(user)
            return Response ({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            })
        return Response({'error': 'Invalid credentials'}, status=400)
    return Response(serialize.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        refresh_token = request.data['refresh']
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Logged out'})
    except Exception:
        return Response({'error': 'Invalid token'}, status=400)


class TaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(user=request.user)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

def update_user_gamification(user, old_status, new_status):
    from .models import UserProfile
    from django.utils import timezone
    from datetime import timedelta
    if old_status != 'done' and new_status == 'done':
        profile, _ = UserProfile.objects.get_or_create(user=user)
        today = timezone.now().date()
        if profile.last_completed_date == today:
            pass
        elif profile.last_completed_date == today - timedelta(days=1):
            profile.current_streak += 1
        else:
            profile.current_streak = 1
        profile.total_tasks_completed += 1
        profile.last_completed_date = today
        profile.save()

class TaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Task.objects.get(pk=pk, user=user)
        except Task.DoesNotExist as e:
            return None

    def get(self, request, pk):
        task = self.get_object(pk, request.user)

        if not task:
            return Response({'error': 'Not found'}, status=404)
        return Response(TaskSerializer(task).data)

    def put(self, request, pk):
        task = self.get_object(pk, request.user)
        if not task:
            return Response({'error': 'Not found'}, status=404)
        old_status = task.status
        serializer = TaskSerializer(task, data=request.data)

        if serializer.is_valid():
            serializer.save()
            update_user_gamification(request.user, old_status, serializer.validated_data.get('status', old_status))
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def patch(self, request, pk):
        task = self.get_object(pk, request.user)
        if not task:
            return Response({'error': 'Not found'}, status=404)
        old_status = task.status
        serializer = TaskSerializer(task, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            new_status = serializer.validated_data.get('status', old_status)
            update_user_gamification(request.user, old_status, new_status)
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        task = self.get_object(pk, request.user)
        if not task:
            return Response({'error': 'Not found'}, status=404)

        task.delete()
        return Response(status=204)

from .models import SubTask
from .serializers import SubTaskSerializer

class SubTaskListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, task_pk):
        try:
            task = Task.objects.get(pk=task_pk, user=request.user)
        except Task.DoesNotExist:
            return Response({'error': 'Task not found'}, status=404)

        serializer = SubTaskSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(task=task)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class SubTaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return SubTask.objects.get(pk=pk, task__user=user)
        except SubTask.DoesNotExist:
            return None

    def patch(self, request, pk):
        subtask = self.get_object(pk, request.user)
        if not subtask:
            return Response({'error': 'Not found'}, status=404)
        serializer = SubTaskSerializer(subtask, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            
            task = subtask.task
            total_subtasks = task.subtasks.count()
            if total_subtasks > 0:
                completed_count = task.subtasks.filter(is_completed=True).count()
                old_status = task.status
                new_status = old_status

                if completed_count == total_subtasks:
                    new_status = 'done'
                elif completed_count > 0:
                    new_status = 'in_progress'
                else:
                    new_status = 'todo'

                if new_status != old_status:
                    task.status = new_status
                    task.save()
                    update_user_gamification(request.user, old_status, new_status)
            
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        subtask = self.get_object(pk, request.user)
        if not subtask:
            return Response({'error': 'Not found'}, status=404)
        subtask.delete()
        return Response(status=204)

from django.db.models import Q

class CategoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        categories = Category.objects.filter(Q(user=request.user) | Q(user__isnull=True))
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Category.objects.get(Q(pk=pk) & (Q(user=user) | Q(user__isnull=True)))
        except Category.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk, request.user)
        if not category:
            return Response({'error': 'Not found'}, status=404)
        return Response(CategorySerializer(category).data)

    def put(self, request, pk):
        category = self.get_object(pk, request.user)
        if not category or category.user != request.user:
            return Response({'error': 'Permission denied or not found'}, status=403 if category else 404)
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        category = self.get_object(pk, request.user)
        if not category or category.user != request.user:
            return Response({'error': 'Permission denied or not found'}, status=403 if category else 404)
        category.delete()
        return Response(status=204)


class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        from datetime import timedelta

        user  = request.user
        tasks = Task.objects.filter(user=user)

        total       = tasks.count()
        completed   = tasks.filter(status='done').count()
        in_progress = tasks.filter(status='in_progress').count()
        todo        = tasks.filter(status='todo').count()
        rate        = round(completed / total * 100) if total else 0

        # Weekly chart — tasks created each of last 7 days
        today      = timezone.now().date()
        week_chart = []
        for i in range(6, -1, -1):
            day       = today - timedelta(days=i)
            day_tasks = tasks.filter(created_at__date=day)
            week_chart.append({
                'day':       day.strftime('%a'),
                'total':     day_tasks.count(),
                'completed': day_tasks.filter(status='done').count(),
                'is_today':  i == 0,
            })

        # Today's tasks (deadline today or no deadline, not done, up to 8)
        today_tasks = list(tasks.filter(
            deadline__date=today, status__in=['todo', 'in_progress']
        )[:4]) + list(tasks.filter(status='done')[:4])
        today_tasks = today_tasks[:8]

        # Upcoming deadlines
        upcoming = tasks.filter(
            deadline__gte=timezone.now(),
            status__in=['todo', 'in_progress']
        ).order_by('deadline')[:5]

        def fmt_task(t):
            return {
                'id':       t.id,
                'title':    t.title,
                'status':   t.status,
                'deadline': t.deadline.isoformat() if t.deadline else None,
                'category': t.category.name if t.category else None,
            }

        initials = (user.username[:2]).upper()

        from .models import UserProfile
        profile, _ = UserProfile.objects.get_or_create(user=user)
        current_streak = profile.current_streak

        return Response({
            'profile': {
                'username': user.username,
                'email':    user.email,
                'initials': initials,
                'current_streak': current_streak,
            },
            'stats': {
                'total':       total,
                'completed':   completed,
                'in_progress': in_progress,
                'todo':        todo,
                'rate':        rate,
            },
            'week_chart':   week_chart,
            'today_tasks':  [fmt_task(t) for t in today_tasks],
            'upcoming':     [fmt_task(t) for t in upcoming],
        })


class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({'username': user.username, 'email': user.email})

    def patch(self, request):
        user = request.user
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()

        if username and username != user.username:
            if User.objects.filter(username=username).exclude(pk=user.pk).exists():
                return Response({'error': 'Username already taken'}, status=400)
            user.username = username

        if email:
            user.email = email

        user.save()
        return Response({'username': user.username, 'email': user.email})


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get('old_password', '')
        new_password = request.data.get('new_password', '')

        if not old_password or not new_password:
            return Response({'error': 'Both fields are required'}, status=400)

        if not user.check_password(old_password):
            return Response({'error': 'Current password is incorrect'}, status=400)

        if len(new_password) < 6:
            return Response({'error': 'New password must be at least 6 characters'}, status=400)

        user.set_password(new_password)
        user.save()
        return Response({'message': 'Password changed successfully'})


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def task_comments_view(request, pk):
    try:
        task = Task.objects.get(pk=pk, user=request.user)
    except Task.DoesNotExist:
        return Response({'error': 'Task not found'}, status=404)

    if request.method == 'GET':
        comments = task.comments.all()
        serializer = TaskCommentSerializer(comments, many=True)
        return Response(serializer.data)

    serializer = TaskCommentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(task=task, user=request.user)
        return Response(serializer.data, status=201)
    return Response(serializer.errors, status=400)

