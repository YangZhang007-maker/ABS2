<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  DashboardOutlined,
  AppstoreOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { useProductStore } from '@/stores/product.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useUiStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const route = useRoute();
const productStore = useProductStore();
const dashboardStore = useDashboardStore();
const uiStore = useUiStore();
const authStore = useAuthStore();

const selectedKeys = computed(() => {
  if (route.name === 'dashboard') return ['dashboard'];
  if (route.name === 'products' || route.name === 'product-detail') return ['products'];
  if (route.name === 'document-search') return ['document-search'];
  return ['dashboard'];
});

function handleMenuClick(info: { key: string }) {
  const key = info.key;
  if (key === 'dashboard') {
    productStore.selectProduct(null);
    dashboardStore.fetchSchedule();
    router.push('/');
  } else if (key === 'products') {
    router.push('/products');
  } else if (key === 'document-search') {
    router.push('/documents');
  }
}

</script>

<template>
  <a-layout-sider
    v-model:collapsed="uiStore.sidebarCollapsed"
    collapsible
    width="240"
    :style="{ background: '#fff' }"
  >
    <div class="logo">
      <span v-if="!uiStore.sidebarCollapsed">ABS智能提醒</span>
      <span v-else>ABS</span>
    </div>
    <a-menu
      mode="inline"
      :selectedKeys="selectedKeys"
      @click="handleMenuClick"
    >
      <a-menu-item v-if="!authStore.isSales" key="dashboard">
        <template #icon><DashboardOutlined /></template>
        日程安排表
      </a-menu-item>
      <a-menu-item key="products">
        <template #icon><AppstoreOutlined /></template>
        产品管理
      </a-menu-item>
      <a-menu-item key="document-search">
        <template #icon><SearchOutlined /></template>
        文档检索
      </a-menu-item>

      
          </a-menu>
  </a-layout-sider>
</template>

<style scoped>
.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 700;
  color: #1890ff;
  border-bottom: 1px solid #f0f0f0;
}

</style>