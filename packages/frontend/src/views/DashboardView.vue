<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import {
  SearchOutlined,
  TableOutlined,
  CalendarOutlined,
} from '@ant-design/icons-vue';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useProductStore } from '@/stores/product.store';
import { dashboardApi } from '@/api/dashboard.api';
import type { ScheduleItem } from '@/types/api';
import ScheduleTable from '@/components/schedule/ScheduleTable.vue';
import CalendarView from '@/components/schedule/CalendarView.vue';

const dashboardStore = useDashboardStore();
const productStore = useProductStore();
const searchText = ref('');
const viewMode = ref<'table' | 'calendar'>('calendar');
const calendarItems = ref<ScheduleItem[]>([]);
const calendarLoading = ref(false);

onMounted(() => {
  dashboardStore.fetchSchedule(productStore.selectedProductId || undefined);
  fetchCalendarData();
});

// When switching to calendar, fetch ALL items
watch(viewMode, async (mode) => {
  if (mode === 'calendar') {
    await fetchCalendarData();
  }
});

async function fetchCalendarData() {
  calendarLoading.value = true;
  try {
    const data = await dashboardApi.getSchedule(
      productStore.selectedProductId || undefined,
      dashboardStore.showCompleted,
      undefined,
      1,
      9999,
    );
    calendarItems.value = data.items;
  } finally {
    calendarLoading.value = false;
  }
}

function handleSearch() {
  dashboardStore.currentPage = 1;
  dashboardStore.fetchSchedule(
    productStore.selectedProductId || undefined,
    searchText.value.trim() || undefined,
    1,
    dashboardStore.pageSize,
  );
}

function handlePageChange(page: number) {
  dashboardStore.fetchSchedule(
    productStore.selectedProductId || undefined,
    searchText.value.trim() || undefined,
    page,
    dashboardStore.pageSize,
  );
}

function handleTabChange(e: any) {
  dashboardStore.setShowCompleted(e.target.value);
  dashboardStore.currentPage = 1;
  dashboardStore.fetchSchedule(
    productStore.selectedProductId || undefined,
    searchText.value.trim() || undefined,
    1,
    dashboardStore.pageSize,
  );
  fetchCalendarData();
}

function refreshSchedule() {
  dashboardStore.fetchSchedule(
    productStore.selectedProductId || undefined,
    searchText.value.trim() || undefined,
    dashboardStore.currentPage,
    dashboardStore.pageSize,
  );
  fetchCalendarData();
}

function clearFilter() {
  productStore.selectProduct(null);
  dashboardStore.fetchSchedule(undefined, searchText.value.trim() || undefined, 1, dashboardStore.pageSize);
}
</script>

<template>
  <div>
    <div class="page-header">
      <h2>日程安排表</h2>
      <div style="display: flex; align-items: center; gap: 12px">
        <span v-if="productStore.selectedProductId" class="filter-tag">
          <a-tag color="blue" closable @close="clearFilter">
            筛选: {{ productStore.products.find(p => p.id === productStore.selectedProductId)?.name || '未知产品' }}
          </a-tag>
        </span>
        <a-radio-group v-model:value="viewMode" button-style="solid" size="small">
          <a-radio-button value="table"><TableOutlined /> 列表</a-radio-button>
          <a-radio-button value="calendar"><CalendarOutlined /> 日历</a-radio-button>
        </a-radio-group>
      </div>
    </div>

    <!-- Search bar (table view only) -->
    <div v-if="viewMode === 'table'" style="margin-bottom: 16px; display: flex; gap: 8px">
      <a-input
        v-model:value="searchText"
        placeholder="搜索产品名称..."
        style="width: 260px"
        allow-clear
        @pressEnter="handleSearch"
      >
        <template #prefix><SearchOutlined /></template>
      </a-input>
      <a-button type="primary" @click="handleSearch">查询</a-button>
    </div>

    <!-- Table view -->
    <template v-if="viewMode === 'table'">
      <ScheduleTable
        :items="dashboardStore.scheduleItems"
        :loading="dashboardStore.loading"
        :showCompleted="dashboardStore.showCompleted"
        @tab-change="handleTabChange"
      />

      <div style="margin-top: 16px; display: flex; justify-content: flex-end; align-items: center; gap: 16px">
        <span style="color: #8c8c8c">共 {{ dashboardStore.total }} 条日程/提醒</span>
        <a-pagination
          :current="dashboardStore.currentPage"
          :total="dashboardStore.total"
          :pageSize="dashboardStore.pageSize"
          :showSizeChanger="false"
          size="small"
          @change="handlePageChange"
        />
      </div>
    </template>

    <!-- Calendar view -->
    <CalendarView
      v-if="viewMode === 'calendar'"
      :items="calendarItems"
      :loading="calendarLoading"
      :showCompleted="dashboardStore.showCompleted"
      @tab-change="handleTabChange"
      @refresh="refreshSchedule"
    />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.page-header h2 {
  margin: 0;
}
.filter-tag {
  display: flex;
  align-items: center;
}
</style>