import http from './client';
import type { UserInfo } from '@/types/auth';

export const userApi = {
  list(): Promise<UserInfo[]> {
    return http.get('/users');
  },

  listByRole(role: string): Promise<UserInfo[]> {
    return http.get('/users/by-role', { params: { role } });
  },
};