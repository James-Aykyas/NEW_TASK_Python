import { Task } from '../types';

export interface Reminder {
  id: string;
  taskId: string;
  message: string;
  scheduledTime: Date;
  priority: 'high' | 'medium' | 'low';
  sent: boolean;
  type: 'deadline' | 'preparation' | 'followup';
}

export class ReminderService {
  private reminders: Reminder[] = [];
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();

  scheduleReminder(task: Task, reminderTime: Date, type: 'deadline' | 'preparation' | 'followup' = 'deadline'): void {
    const reminder: Reminder = {
      id: crypto.randomUUID(),
      taskId: task.id,
      message: this.generateReminderMessage(task, type),
      scheduledTime: reminderTime,
      priority: task.priority,
      sent: false,
      type
    };

    this.reminders.push(reminder);
    this.scheduleNotification(reminder);
  }

  private scheduleNotification(reminder: Reminder): void {
    const now = new Date();
    const delay = reminder.scheduledTime.getTime() - now.getTime();

    if (delay > 0) {
      const timer = setTimeout(() => {
        this.sendReminder(reminder);
      }, delay);

      this.activeTimers.set(reminder.id, timer);
    } else if (delay > -300000) { // If less than 5 minutes past, still send
      this.sendReminder(reminder);
    }
  }

  private sendReminder(reminder: Reminder): void {
    // In a real app, this would send push notifications, emails, etc.
    console.log(`🔔 REMINDER: ${reminder.message}`);
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`TaskMaster AI - ${reminder.priority.toUpperCase()} Priority`, {
        body: reminder.message,
        icon: '/favicon.ico',
        tag: reminder.taskId
      });
    }

    // Update reminder as sent
    reminder.sent = true;
    this.activeTimers.delete(reminder.id);

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('reminderSent', { 
      detail: { reminder } 
    }));
  }

  private generateReminderMessage(task: Task, type: string): string {
    const priorityEmoji = {
      high: '🚨',
      medium: '⚠️',
      low: 'ℹ️'
    };

    const typeMessages = {
      deadline: `${priorityEmoji[task.priority]} Task deadline approaching: ${task.content}`,
      preparation: `${priorityEmoji[task.priority]} Time to prepare for: ${task.content}`,
      followup: `${priorityEmoji[task.priority]} Follow up needed on: ${task.content}`
    };

    return typeMessages.preparation || typeMessages.followup || typeMessages.deadline;
  }

  getUpcomingReminders(hours: number = 24): Reminder[] {
    const now = new Date();
    const cutoff = new Date(now.getTime() + (hours * 60 * 60 * 1000));

    return this.reminders
      .filter(r => !r.sent && r.scheduledTime <= cutoff && r.scheduledTime >= now)
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  cancelReminder(reminderId: string): void {
    const timer = this.activeTimers.get(reminderId);
    if (timer) {
      clearTimeout(timer);
      this.activeTimers.delete(reminderId);
    }

    this.reminders = this.reminders.filter(r => r.id !== reminderId);
  }

  cancelTaskReminders(taskId: string): void {
    const taskReminders = this.reminders.filter(r => r.taskId === taskId);
    taskReminders.forEach(reminder => {
      this.cancelReminder(reminder.id);
    });
  }

  static calculateReminderTime(task: Task, priority: 'high' | 'medium' | 'low'): Date {
    const now = new Date();
    const dueDate = task.dueDate || new Date(now.getTime() + (24 * 60 * 60 * 1000)); // Default to 1 day
    const timeToDue = dueDate.getTime() - now.getTime();

    // If task is due within 24 hours, automatically treat as high priority for reminders
    const effectivePriority = timeToDue <= (24 * 60 * 60 * 1000) ? 'high' : priority;
    
    let reminderOffset: number;

    if (effectivePriority === 'high') {
      // High priority or due within 24 hours: 15 minutes to 2 hours before
      if (timeToDue <= (2 * 60 * 60 * 1000)) { // Less than 2 hours
        reminderOffset = Math.max(timeToDue * 0.25, 15 * 60 * 1000); // 25% of remaining time, min 15 min
      } else if (timeToDue <= (8 * 60 * 60 * 1000)) { // Less than 8 hours
        reminderOffset = 1 * 60 * 60 * 1000; // 1 hour before
      } else {
        reminderOffset = 2 * 60 * 60 * 1000; // 2 hours before
      }
    } else if (effectivePriority === 'medium') {
      // Medium priority: 1 hour to 4 hours before
      if (timeToDue <= (4 * 60 * 60 * 1000)) {
        reminderOffset = Math.max(timeToDue * 0.25, 1 * 60 * 60 * 1000); // 25% or 1 hour min
      } else {
        reminderOffset = 4 * 60 * 60 * 1000; // 4 hours before
      }
    } else {
      // Low priority: 4 hours to 1 day before
      if (timeToDue <= (24 * 60 * 60 * 1000)) {
        reminderOffset = Math.max(timeToDue * 0.5, 4 * 60 * 60 * 1000); // 50% or 4 hours min
      } else {
        reminderOffset = 24 * 60 * 60 * 1000; // 1 day before
      }
    }

    const reminderTime = new Date(dueDate.getTime() - reminderOffset);
    
    // Ensure reminder time is not in the past
    return reminderTime > now ? reminderTime : new Date(now.getTime() + (5 * 60 * 1000)); // 5 minutes from now if in past
  }

  requestNotificationPermission(): void {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          console.log('Notification permission granted');
        }
      });
    }
  }

  getAllReminders(): Reminder[] {
    return [...this.reminders];
  }
}