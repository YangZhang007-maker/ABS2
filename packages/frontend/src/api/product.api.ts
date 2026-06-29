import http from './client';
import type { Product, CreateProductData, UpdateProductData, UpdateSalespersonsData } from '@/types/product';
import type { UserInfo } from '@/types/auth';

export const productApi = {
  list(search?: string, page?: number, limit?: number): Promise<{ items: Product[]; total: number; page: number; limit: number }> {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);
    return http.get('/products', { params });
  },

  get(id: string): Promise<Product> {
    return http.get(`/products/${id}`);
  },

  create(data: CreateProductData): Promise<Product> {
    return http.post('/products', data);
  },

  update(id: string, data: UpdateProductData): Promise<Product> {
    return http.patch(`/products/${id}`, data);
  },

  remove(id: string): Promise<void> {
    return http.delete(`/products/${id}`);
  },

  getSalespersons(productId: string): Promise<UserInfo[]> {
    return http.get(`/products/${productId}/salespersons`);
  },

  updateSalespersons(productId: string, data: UpdateSalespersonsData): Promise<Product> {
    return http.patch(`/products/${productId}/salespersons`, data);
  },
};