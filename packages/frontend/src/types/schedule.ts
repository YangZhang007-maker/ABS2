export enum EventType {
  ESTABLISHMENT = 'establishment',
  PAYMENT = 'payment',
  CALCULATION = 'calculation',
}

export const EVENT_TYPE_OPTIONS = [
  { value: 'establishment', label: '设立日' },
  { value: 'payment', label: '兑付日' },
  { value: 'calculation', label: '计算日' },
  { value: '__custom__', label: '自定义...' },
] as const;

export interface ScheduleEvent {
  id: string;
  productId: string;
  product?: { id: string; name: string };
  eventType: string;
  scheduleName: string;
  remark: string | null;
  eventDate: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleEventData {
  eventType: string;
  remark?: string;
  eventDate: string;
}

export interface UpdateScheduleEventData {
  eventType?: string;
  remark?: string;
  eventDate?: string;
}