import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TaskService } from '../../services/task-service';
import { Task } from '../../models/task';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.css']
})
export class Calendar implements OnInit {
  currentDate = signal(new Date());
  
  days = computed(() => {
    const date = this.currentDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    const startDay = firstDayOfMonth.getDay() || 7; // Convert 0 (Sun) to 7
    const daysInPrevMonth = startDay - 1;
    
    const calendarDays: CalendarDay[] = [];
    
    // Previous month padding
    const prevMonthLastDay = new Date(year, month, 0);
    for (let i = daysInPrevMonth - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      calendarDays.push(this.createCalendarDay(d, false));
    }
    
    // Current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      calendarDays.push(this.createCalendarDay(d, true));
    }
    
    // Next month padding
    const remainingDays = 42 - calendarDays.length;
    for (let i = 1; i <= remainingDays; i++) {
      const d = new Date(year, month + 1, i);
      calendarDays.push(this.createCalendarDay(d, false));
    }
    
    return calendarDays;
  });

  weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  constructor(public taskService: TaskService) {}

  ngOnInit() {
    this.taskService.loadInitialData();
  }

  createCalendarDay(date: Date, isCurrentMonth: boolean): CalendarDay {
    const today = new Date();
    const isToday = date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
    
    const dayTasks = this.taskService.tasks().filter(task => {
      if (!task.deadline) return false;
      const d = new Date(task.deadline);
      return d.getDate() === date.getDate() && 
             d.getMonth() === date.getMonth() && 
             d.getFullYear() === date.getFullYear();
    });

    return {
      date,
      isCurrentMonth,
      isToday,
      tasks: dayTasks
    };
  }

  prevMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth() {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  getMonthName() {
    return this.currentDate().toLocaleString('en-US', { month: 'long', year: 'numeric' });
  }

  getCategoryColor(task: Task): string {
    if (!task.category) return '#f0f2f5';
    // Simple hash to color or predefined colors
    return '#e3f2fd'; 
  }

  formatTime(iso: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
