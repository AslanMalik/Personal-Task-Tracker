import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task-service';
import { Task } from '../../models/task';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.html',
  styleUrls: ['./tasks.css']
})
export class Tasks implements OnInit {
  newTask: Partial<Task> = {
    title: '',
    category: undefined,
    status: 'todo',
    description: '',
    deadline: null
  };

  showCalendar = signal(false);
  calendarDate = signal(new Date());
  showOverdueAlert = signal(false);

  get calendarDays(): (Date | null)[] {
    const d = this.calendarDate();
    const year = d.getFullYear();
    const month = d.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    const offset = (firstDay === 0 ? 6 : firstDay - 1);
    for (let i = 0; i < offset; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }

  get calendarMonthLabel(): string {
    return this.calendarDate().toLocaleString('en', { month: 'long', year: 'numeric' });
  }

  selectedDeadlineDate: Date | null = null;
  deadlineHour = '23';
  deadlineMinute = '59';

  constructor(public taskService: TaskService) {}

  ngOnInit() {
    // Загружаем задачи и после получения показываем гифку если есть просроченные
    this.taskService.loadTasks().subscribe(tasks => {
      const hasOverdue = tasks.some(
        t => t.deadline && new Date(t.deadline).getTime() < Date.now() && t.status !== 'done'
      );
      if (hasOverdue) {
        this.showOverdueAlert.set(true);
        setTimeout(() => this.showOverdueAlert.set(false), 3000);
      }
    });

    this.taskService.loadInitialData();
  }

  get deadlineLabel(): string {
    if (!this.newTask.deadline) return 'Set deadline';
    return new Date(this.newTask.deadline).toLocaleString('en', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  openCalendar() {
    this.calendarDate.set(this.selectedDeadlineDate ?? new Date());
    this.showCalendar.set(true);
  }

  prevMonth() {
    const d = this.calendarDate();
    this.calendarDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.calendarDate();
    this.calendarDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  selectDay(day: Date | null) {
    if (!day) return;
    this.selectedDeadlineDate = day;
  }

  isSelectedDay(day: Date | null): boolean {
    if (!day || !this.selectedDeadlineDate) return false;
    return day.toDateString() === this.selectedDeadlineDate.toDateString();
  }

  isToday(day: Date | null): boolean {
    if (!day) return false;
    return day.toDateString() === new Date().toDateString();
  }

  isPast(day: Date | null): boolean {
    if (!day) return false;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return day < today;
  }

  confirmDeadline() {
    if (!this.selectedDeadlineDate) return;
    const d = new Date(this.selectedDeadlineDate);
    d.setHours(Number(this.deadlineHour), Number(this.deadlineMinute), 0, 0);
    this.newTask.deadline = d.toISOString();
    this.showCalendar.set(false);
  }

  clearDeadline() {
    this.newTask.deadline = null;
    this.selectedDeadlineDate = null;
    this.showCalendar.set(false);
  }

  getTaskDeadlineLabel(deadline: string | null | undefined): string {
    if (!deadline) return '';
    return new Date(deadline).toLocaleString('en', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  isDeadlineUrgent(deadline: string | null | undefined): boolean {
    if (!deadline) return false;
    const diff = new Date(deadline).getTime() - Date.now();
    return diff > 0 && diff < 24 * 60 * 60 * 1000;
  }

  isDeadlineOverdue(deadline: string | null | undefined): boolean {
    if (!deadline) return false;
    return new Date(deadline).getTime() < Date.now();
  }

  createTask() {
    if (!this.newTask.title?.trim()) return;
    this.taskService.addTask(this.newTask).subscribe({
      next: () => {
        this.newTask = { title: '', category: undefined, status: 'todo', description: '', deadline: null };
        this.selectedDeadlineDate = null;
        this.showCalendar.set(false);
      },
      error: (err) => console.error('Error creating task:', err)
    });
  }

  changeStatus(task: Task, newStatus: any) {
    this.taskService.updateTaskStatus(task, newStatus).subscribe({
      error: (err) => console.error('Update error:', err)
    });
  }

  deleteTask(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id).subscribe({
        error: (err) => console.error('Delete error:', err)
      });
    }
  }

  getCategoryName(cat: any): string {
    if (!cat) return 'No Category';
    if (typeof cat === 'object') return cat.name;
    const found = this.taskService.categories().find(c => c.id === cat);
    return found ? found.name : 'Category';
  }
}