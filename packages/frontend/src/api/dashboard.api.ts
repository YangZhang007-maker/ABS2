import http from './client';
import type { ScheduleItem } from '@/types/api';

export const dashboardApi = {
  getSchedule(
    productId?: string,
    completed?: boolean,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<{ items: ScheduleItem[]; total: number; page: number; limit: number }> {
    const params: Record<string, string> = {};
    if (productId) params.productId = productId;
    if (completed !== undefined) params.completed = String(completed);
    if (search) params.search = search;
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);
    return http.get('/dashboard/schedule', { params });
  },
};