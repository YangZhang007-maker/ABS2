<script setup lang="ts">
import { ref, onMounted } from 'vue';
import {
  DownloadOutlined,
  SearchOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  InboxOutlined,
} from '@ant-design/icons-vue';
import { documentApi } from '@/api/document.api';
import type { DocumentItem } from '@/types/document';
import type { TableColumnsType } from 'ant-design-vue';
import dayjs from 'dayjs';

const loading = ref(false);
const documents = ref<DocumentItem[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(10);

const searchProductName = ref('');
const searchDocName = ref('');

async function fetchDocuments() {
  loading.value = true;
  try {
    const result = await documentApi.search(
      searchDocName.value.trim() || undefined,
      undefined,
      searchProductName.value.trim() || undefined,
      currentPage.value,
      pageSize.value,
    );
    documents.value = result.items;
    total.value = result.total;
  } catch {
    // handled by interceptor
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  currentPage.value = 1;
  fetchDocuments();
}

function handlePageChange(page: number) {
  currentPage.value = page;
  fetchDocuments();
}

function handleDownload(doc: DocumentItem) {
  const url = documentApi.getDownloadUrl(doc.productId, doc.id);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.originalName;
  a.click();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getDocIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return FilePdfOutlined;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileWordOutlined;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileExcelOutlined;
  return InboxOutlined;
}

function getDocColor(mimeType: string): string {
  if (mimeType.includes('pdf')) return '#ff4d4f';
  if (mimeType.includes('word') || mimeType.includes('document')) return '#1677ff';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '#52c41a';
  return '#8c8c8c';
}

function getDocLabel(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
  return '其他';
}

onMounted(() => {
  fetchDocuments();
});

const columns: TableColumnsType = [
  { title: '文件名', key: 'name', width: 260 },
  { title: '所属产品', key: 'product', width: 180 },
  { title: '类型', key: 'type', width: 80 },
  { title: '大小', key: 'size', width: 100 },
  { title: '上传时间', dataIndex: 'createdAt', key: 'time', width: 170 },
  { title: '操作', key: 'actions', width: 100 },
];
</script>

<template>
  <div>
    <h2 style="margin-bottom: 24px">文档检索</h2>

    <!-- Search bar -->
    <div
      style="
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
        padding: 16px;
        background: #fafafa;
        border-radius: 8px;
      "
    >
      <span style="white-space: nowrap; color: #666">产品名称：</span>
      <a-input
        v-model:value="searchProductName"
        placeholder="输入产品名称进行筛选"
        style="width: 200px"
        allow-clear
        @pressEnter="handleSearch"
      />
      <span style="white-space: nowrap; color: #666">文档名称：</span>
      <a-input
        v-model:value="searchDocName"
        placeholder="输入文档名称进行筛选"
        style="width: 200px"
        allow-clear
        @pressEnter="handleSearch"
      />
      <a-button type="primary" @click="handleSearch">
        <template #icon><SearchOutlined /></template>
        查询
      </a-button>
    </div>

    <a-table
      :columns="columns"
      :dataSource="documents"
      :loading="loading"
      rowKey="id"
      :pagination="false"
      size="middle"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'name'">
          <component
            :is="getDocIcon(record.mimeType)"
            :style="{ color: getDocColor(record.mimeType), marginRight: '8px', fontSize: '16px' }"
          />
          {{ record.originalName }}
        </template>
        <template v-else-if="column.key === 'product'">
          {{ (record as any).productName || '-' }}
        </template>
        <template v-else-if="column.key === 'type'">
          <a-tag :color="getDocColor(record.mimeType)">
            {{ getDocLabel(record.mimeType) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'size'">
          {{ formatSize(record.fileSize) }}
        </template>
        <template v-else-if="column.key === 'time'">
          {{ dayjs(record.createdAt).format('YYYY-MM-DD HH:mm') }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-button size="small" type="link" @click="handleDownload(record)">
            <DownloadOutlined /> 下载
          </a-button>
        </template>
      </template>

      <template #emptyText>
        <a-empty description="暂无文档" />
      </template>
    </a-table>

    <!-- Pagination -->
    <div style="margin-top: 16px; display: flex; justify-content: flex-end; align-items: center; gap: 16px">
      <span style="color: #8c8c8c">共 {{ total }} 个文档</span>
      <a-pagination
        v-model:current="currentPage"
        :total="total"
        :pageSize="pageSize"
        :showSizeChanger="false"
        size="small"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>