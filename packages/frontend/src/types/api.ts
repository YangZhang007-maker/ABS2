export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScheduleItem {
  id: string;
  type: 'schedule_event' | 'reminder_event';
  productId: string;
  productName: string;
  eventType: string;
  eventName: string;
  relatedEventName?: string;
  date: string;
  isReminder: boolean;
  scheduleEventId?: string;
  completed: boolean;
}