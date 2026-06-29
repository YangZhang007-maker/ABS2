import http from './client';
import type { LoginData, LoginResult, RegisterData, UserInfo, UpdateProfileData } from '@/types/auth';

export const authApi = {
  login(data: LoginData): Promise<LoginResult> {
    return http.post('/auth/login', data);
  },

  register(data: RegisterData): Promise<{ message: string; user: UserInfo }> {
    return http.post('/auth/register', data);
  },

  getMe(): Promise<UserInfo> {
    return http.get('/auth/me');
  },

  updateProfile(data: UpdateProfileData): Promise<UserInfo> {
    return http.patch('/auth/profile', data);
  },
};