from django.db import models
from django.contrib.auth.models import AbstractUser
# Create your models here.

class User(AbstractUser):
  pass

class Category(models.Model):
  name = models.CharField(max_length=100)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
    return self.name


class Task(models.Model):
    STATUS_CHOICES = [('todo', 'To Do'),
          ('in_progress', 'In Progress'),
          ('done', 'Done'),]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    created_at = models.DateTimeField(auto_now_add=True)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')

    def __str__(self):
      return self.title

class TaskComment(models.Model):
  text = models.TextField(blank=True)
  created_at = models.DateTimeField(auto_now_add=True)

  task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name="comments")
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")

  def __str__(self):
    return f"Comment by {self.user} on {self.task}"

