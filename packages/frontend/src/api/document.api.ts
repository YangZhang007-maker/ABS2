import http from './client';
import type { DocumentItem } from '@/types/document';

export const documentApi = {
  list(productId: string): Promise<DocumentItem[]> {
    return http.get(`/products/${productId}/documents`);
  },

  listByEvent(productId: string, scheduleEventId: string): Promise<DocumentItem[]> {
    return http.get(`/products/${productId}/documents`, {
      params: { scheduleEventId },
    });
  },

  search(
    query?: string,
    productId?: string,
    productName?: string,
    page?: number,
    limit?: number,
  ): Promise<{ items: DocumentItem[]; total: number; page: number; limit: number }> {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (productId) params.productId = productId;
    if (productName) params.productName = productName;
    if (page) params.page = String(page);
    if (limit) params.limit = String(limit);
    return http.get('/documents/search', { params });
  },

  upload(productId: string, file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    return http.post(`/products/${productId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadToEvent(productId: string, scheduleEventId: string, file: File): Promise<DocumentItem> {
    const formData = new FormData();
    formData.append('file', file);
    const params: Record<string, string> = {};
    if (scheduleEventId) params.scheduleEventId = scheduleEventId;
    const queryString = scheduleEventId ? `?scheduleEventId=${encodeURIComponent(scheduleEventId)}` : '';
    return http.post(`/products/${productId}/documents${queryString}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getDownloadUrl(productId: string, docId: string): string {
    return `/api/v1/products/${productId}/documents/${docId}/download`;
  },

  remove(productId: string, docId: string): Promise<{ success: boolean }> {
    return http.delete(`/products/${productId}/documents/${docId}`);
  },
};