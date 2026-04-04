from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view),
    path('login/', views.login_view),
    path('logout/', views.logout_view),
    path('tasks/', views.TaskListCreateView.as_view()),
    path('tasks/<int:pk>/', views.TaskDetailView.as_view()),
    path('tasks/<int:pk>/comments/', views.task_comments_view),
    path('categories/', views.CategoryListCreateView.as_view()),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view()),
]