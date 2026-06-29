import type { ScheduleEvent } from './schedule';
import type { UserInfo } from './auth';

export interface Product {
  id: string;
  name: string;
  creator: string;
  creatorId?: string | null;
  isDeleted: boolean;
  scheduleEvents?: ScheduleEvent[];
  salespersons?: UserInfo[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductData {
  name: string;
  creator: string;
}

export interface UpdateProductData {
  name?: string;
  creator?: string;
}

export interface UpdateSalespersonsData {
  salespersonIds: string[];
}