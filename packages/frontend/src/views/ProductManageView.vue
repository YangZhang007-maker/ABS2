<script setup lang="ts">
import { onMounted, ref, computed } from 'vue';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import { useRouter } from 'vue-router';
import { useProductStore } from '@/stores/product.store';
import { useUiStore } from '@/stores/ui.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import type { Product } from '@/types/product';
import type { TableColumnsType } from 'ant-design-vue';
import dayjs from 'dayjs';
import DocumentManagerModal from '@/components/document/DocumentManagerModal.vue';

const productStore = useProductStore();
const uiStore = useUiStore();
const dashboardStore = useDashboardStore();
const authStore = useAuthStore();
const router = useRouter();

const docModalVisible = ref(false);
const docModalProductId = ref('');
const docModalProductName = ref('');
const searchText = ref('');

onMounted(() => {
  productStore.fetchProducts();
});

function handleEdit(product: Product) {
  uiStore.openProductForm(product.id);
}

function handleDelete(product: Product) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除产品「${product.name}」吗？删除后相关的日程事件和提醒事件也将被删除。`,
    okText: '确认删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      await productStore.deleteProduct(product.id);
      dashboardStore.fetchSchedule();
    },
  });
}

function handleCreate() {
  uiStore.openProductForm();
}

function handleDocuments(product: Product) {
  docModalProductId.value = product.id;
  docModalProductName.value = product.name;
  docModalVisible.value = true;
}

function handleDetail(product: Product) {
  if (authStore.isSales) {
    router.push(`/products/sales/${product.id}`);
  } else {
    router.push(`/products/${product.id}`);
  }
}

function handleProductNameClick(product: Product) {
  if (authStore.isSales) {
    router.push(`/products/sales/${product.id}`);
  }
}

function handleSearch() {
  productStore.currentPage = 1;
  productStore.fetchProducts(searchText.value.trim() || undefined, 1, productStore.pageSize);
}

function handlePageChange(page: number) {
  productStore.fetchProducts(searchText.value.trim() || undefined, page, productStore.pageSize);
}

const canEdit = (product: Product) => {
  return authStore.isRoot || (authStore.isProductOwner && product.creatorId === authStore.user?.id);
};

const columns = computed<TableColumnsType>(() => {
  const base: TableColumnsType = [
    { title: '产品名称', dataIndex: 'name', key: 'name', width: 220 },
    { title: '创建人', dataIndex: 'creator', key: 'creator', width: 130 },
  ];
  if (authStore.isSales) return base;
  return [
    ...base,
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 170 },
    { title: '操作', key: 'actions', width: 240 },
  ];
});
</script>

<template>
  <div>
    <div class="page-header">
      <h2>产品管理</h2>
      <a-button v-if="!authStore.isSales" type="primary" @click="handleCreate">
        <template #icon><PlusOutlined /></template>
        创建产品
      </a-button>
    </div>

    <!-- Search bar -->
    <div style="margin-bottom: 16px; display: flex; gap: 8px">
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

    <a-table
      :columns="columns"
      :dataSource="productStore.products"
      :loading="productStore.loading"
      rowKey="id"
      :pagination="false"
      size="middle"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <a v-if="authStore.isSales" type="link" @click="handleProductNameClick(record)" style="cursor: pointer; color: #1890ff">
            {{ record.name }}
          </a>
          <template v-else>{{ record.name }}</template>
        </template>
        <template v-if="column.key === 'createdAt'">
          {{ dayjs(record.createdAt).format('YYYY-MM-DD HH:mm') }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space size="small">
            <a-button v-if="canEdit(record)" size="small" type="link" @click="handleEdit(record)">
              <EditOutlined /> 编辑
            </a-button>
            <a-button size="small" type="link" @click="handleDetail(record)">
              <InfoCircleOutlined /> 详情
            </a-button>
            <a-button size="small" type="link" @click="handleDocuments(record)">
              <FileTextOutlined /> 文档
            </a-button>
            <a-button v-if="canEdit(record)" size="small" type="link" danger @click="handleDelete(record)">
              <DeleteOutlined /> 删除
            </a-button>
          </a-space>
        </template>
      </template>

      <template #emptyText>
        <a-empty description="暂无产品">
          <a-button v-if="!authStore.isSales" type="primary" @click="handleCreate">创建第一个产品</a-button>
        </a-empty>
      </template>
    </a-table>

    <div style="margin-top: 16px; display: flex; justify-content: flex-end; align-items: center; gap: 16px">
      <span style="color: #8c8c8c">共 {{ productStore.total }} 个产品</span>
      <a-pagination
        v-model:current="productStore.currentPage"
        :total="productStore.total"
        :pageSize="productStore.pageSize"
        :showSizeChanger="false"
        size="small"
        @change="handlePageChange"
      />
    </div>

    <DocumentManagerModal
      v-model:open="docModalVisible"
      :productId="docModalProductId"
      :productName="docModalProductName"
      :isSales="authStore.isSales"
    />
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.page-header h2 {
  margin: 0;
}
</style>