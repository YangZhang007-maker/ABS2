export interface ReminderEvent {
  id: string;
  scheduleEventId: string;
  scheduleEvent?: { id: string; scheduleName: string; eventDate: string; product?: { id: string; name: string } };
  reminderName: string;
  dateMode: 'relative' | 'manual';
  refType: 'T' | 'R' | null;
  offsetDays: number | null;
  manualDate: string | null;
  triggerDate: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderEventData {
  reminderName: string;
  dateMode: 'relative' | 'manual';
  refType?: 'T' | 'R';
  offsetDays?: number;
  manualDate?: string;
}

export interface UpdateReminderEventData {
  reminderName?: string;
  dateMode?: 'relative' | 'manual';
  refType?: 'T' | 'R';
  offsetDays?: number;
  manualDate?: string;
}