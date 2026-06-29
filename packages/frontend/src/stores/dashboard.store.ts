import { defineStore } from 'pinia';
import { ref } from 'vue';
import { dashboardApi } from '@/api/dashboard.api';
import type { ScheduleItem } from '@/types/api';

export const useDashboardStore = defineStore('dashboard', () => {
  const scheduleItems = ref<ScheduleItem[]>([]);
  const total = ref(0);
  const loading = ref(false);
  const showCompleted = ref(false);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const searchQuery = ref('');

  async function fetchSchedule(
    productId?: string,
    search?: string,
    page?: number,
    limit?: number,
  ) {
    loading.value = true;
    try {
      const data = await dashboardApi.getSchedule(
        productId,
        showCompleted.value,
        search,
        page,
        limit,
      );
      scheduleItems.value = data.items;
      total.value = data.total;
      currentPage.value = data.page;
    } finally {
      loading.value = false;
    }
  }

  function setShowCompleted(value: boolean) {
    showCompleted.value = value;
  }

  return {
    scheduleItems,
    total,
    loading,
    showCompleted,
    currentPage,
    pageSize,
    searchQuery,
    fetchSchedule,
    setShowCompleted,
  };
});