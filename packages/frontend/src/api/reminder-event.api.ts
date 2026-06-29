import http from './client';
import type { ReminderEvent, CreateReminderEventData, UpdateReminderEventData } from '@/types/reminder';

export const reminderEventApi = {
  listByScheduleEvent(scheduleEventId: string): Promise<ReminderEvent[]> {
    return http.get(`/schedule-events/${scheduleEventId}/reminders`);
  },

  create(scheduleEventId: string, data: CreateReminderEventData): Promise<ReminderEvent> {
    return http.post(`/schedule-events/${scheduleEventId}/reminders`, data);
  },

  update(id: string, data: UpdateReminderEventData): Promise<ReminderEvent> {
    return http.patch(`/reminders/${id}`, data);
  },

  remove(id: string): Promise<void> {
    return http.delete(`/reminders/${id}`);
  },

  toggleComplete(id: string): Promise<any> {
    return http.patch(`/reminders/${id}/toggle-complete`);
  },
};