import http from './client';
import type { ScheduleEvent, CreateScheduleEventData, UpdateScheduleEventData } from '@/types/schedule';

export const scheduleEventApi = {
  listByProduct(productId: string): Promise<ScheduleEvent[]> {
    return http.get(`/products/${productId}/schedule-events`);
  },

  get(id: string): Promise<ScheduleEvent> {
    return http.get(`/schedule-events/${id}`);
  },

  create(productId: string, data: CreateScheduleEventData): Promise<ScheduleEvent> {
    return http.post(`/products/${productId}/schedule-events`, data);
  },

  update(id: string, data: UpdateScheduleEventData): Promise<ScheduleEvent> {
    return http.patch(`/schedule-events/${id}`, data);
  },

  remove(id: string): Promise<void> {
    return http.delete(`/schedule-events/${id}`);
  },

  toggleComplete(id: string): Promise<any> {
    return http.patch(`/schedule-events/${id}/toggle-complete`);
  },
};