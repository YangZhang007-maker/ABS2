import axios from 'axios';
import { notification } from 'ant-design-vue';

const http = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
});

// Request interceptor: add Authorization header
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('abs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => {
    const body = response.data;
    if (body.code !== 0) {
      notification.error({
        message: '请求错误',
        description: body.message || '未知错误',
      });
      return Promise.reject(new Error(body.message));
    }
    return body.data;
  },
  (error) => {
    const msg =
      error.response?.data?.message ||
      error.message ||
      '网络错误';

    if (error.response?.status === 401) {
      localStorage.removeItem('abs_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    notification.error({
      message: '请求失败',
      description: msg,
    });
    return Promise.reject(error);
  },
);

export default http;