import { defineStore } from 'pinia';
import { ref } from 'vue';
import { productApi } from '@/api/product.api';
import type { Product, CreateProductData, UpdateProductData } from '@/types/product';

export const useProductStore = defineStore('product', () => {
  const products = ref<Product[]>([]);
  const selectedProductId = ref<string | null>(null);
  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const searchQuery = ref('');

  async function fetchProducts(search?: string, page?: number, limit?: number) {
    loading.value = true;
    try {
      const result = await productApi.list(search, page, limit);
      products.value = result.items;
      total.value = result.total;
      currentPage.value = result.page;
    } finally {
      loading.value = false;
    }
  }

  async function createProduct(data: CreateProductData) {
    const product = await productApi.create(data);
    products.value.unshift(product);
    return product;
  }

  async function updateProduct(id: string, data: UpdateProductData) {
    const product = await productApi.update(id, data);
    const idx = products.value.findIndex((p) => p.id === id);
    if (idx !== -1) {
      products.value[idx] = product;
    }
    return product;
  }

  async function deleteProduct(id: string) {
    await productApi.remove(id);
    products.value = products.value.filter((p) => p.id !== id);
    if (selectedProductId.value === id) {
      selectedProductId.value = null;
    }
  }

  function selectProduct(id: string | null) {
    selectedProductId.value = id;
  }

  return {
    products,
    selectedProductId,
    loading,
    total,
    currentPage,
    pageSize,
    searchQuery,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    selectProduct,
  };
});