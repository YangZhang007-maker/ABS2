<script setup lang="ts">
import { ref, watch } from 'vue';
import {
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  InboxOutlined,
  SearchOutlined,
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import { documentApi } from '@/api/document.api';
import type { DocumentItem } from '@/types/document';
import type { TableColumnsType } from 'ant-design-vue';
import dayjs from 'dayjs';

const props = defineProps<{
  open: boolean;
  productId: string;
  productName: string;
  isSales?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const documents = ref<DocumentItem[]>([]);
const loading = ref(false);
const uploading = ref(false);
const searchQuery = ref('');

async function fetchDocuments() {
  if (!props.productId) return;
  loading.value = true;
  try {
    documents.value = await documentApi.list(props.productId);
  } catch (e) {
    console.error('获取文档列表失败:', e);
  } finally {
    loading.value = false;
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    fetchDocuments();
    return;
  }
  loading.value = true;
  try {
    documents.value = (await documentApi.search(searchQuery.value.trim())).items;
  } catch (e) {
    console.error('搜索文档失败:', e);
  } finally {
    loading.value = false;
  }
}

watch(() => props.open, (visible) => {
  if (visible) {
    searchQuery.value = '';
    fetchDocuments();
  }
});

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileTypeIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return FilePdfOutlined;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileWordOutlined;
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return FileExcelOutlined;
  return InboxOutlined;
}

function getFileTypeColor(mimeType: string): string {
  if (mimeType.includes('pdf')) return '#ff4d4f';
  if (mimeType.includes('word') || mimeType.includes('document')) return '#1677ff';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '#52c41a';
  return '#8c8c8c';
}

function getFileTypeLabel(mimeType: string): string {
  if (mimeType.includes('pdf')) return 'PDF';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'Word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'Excel';
  return '其他';
}

function getProductLabel(doc: any): string {
  if (doc.productName && doc.productName !== props.productName) {
    return doc.productName;
  }
  return '';
}

async function handleUpload(options: any) {
  uploading.value = true;
  try {
    await documentApi.upload(props.productId, options.file);
    message.success('文件上传成功');
    await fetchDocuments();
    options.onSuccess();
  } catch (e: any) {
    options.onError(e);
  } finally {
    uploading.value = false;
  }
}

function handleDownload(doc: DocumentItem) {
  const url = documentApi.getDownloadUrl(props.productId, doc.id);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.originalName;
  a.click();
}

function handleDelete(doc: DocumentItem) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除文档「${doc.originalName}」吗？删除后不可恢复。`,
    okText: '确认删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      await documentApi.remove(props.productId, doc.id);
      message.success('文档已删除');
      await fetchDocuments();
    },
  });
}

function handleClose() {
  emit('update:open', false);
}

const columns: TableColumnsType = [
  { title: '文件名', key: 'name', width: 240 },
  { title: '类型', key: 'type', width: 80 },
  { title: '大小', dataIndex: 'fileSize', key: 'size', width: 100 },
  { title: '上传时间', dataIndex: 'createdAt', key: 'time', width: 170 },
  { title: '操作', key: 'actions', width: 150 },
];
</script>

<template>
  <a-modal
    :open="open"
    title="产品文档管理"
    @cancel="handleClose"
    :footer="null"
    width="800px"
    :destroyOnClose="true"
  >
    <div style="margin-bottom: 12px">
      <span style="color: #8c8c8c; margin-right: 8px">当前产品：</span>
      <strong>{{ productName }}</strong>
    </div>

    <!-- Action bar: upload + search -->
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px">
      <a-upload
        v-if="!isSales"
        :customRequest="handleUpload"
        :showUploadList="false"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
      >
        <a-button type="primary" :loading="uploading">
          <template #icon><UploadOutlined /></template>
          上传文档
        </a-button>
      </a-upload>
      <span v-if="!isSales" style="color: #8c8c8c; font-size: 12px">
        支持 PDF、Word、Excel，单个 ≤50MB
      </span>
      <div style="flex: 1" />
      <a-input-search
        v-model:value="searchQuery"
        placeholder="搜索文件名（支持跨产品检索）"
        style="width: 280px"
        @search="handleSearch"
      >
        <template #prefix><SearchOutlined /></template>
      </a-input-search>
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
            :is="getFileTypeIcon(record.mimeType)"
            :style="{ color: getFileTypeColor(record.mimeType), marginRight: '8px', fontSize: '18px' }"
          />
          {{ record.originalName }}
          <a-tag v-if="getProductLabel(record)" color="purple" style="margin-left: 6px; font-size: 11px">
            {{ getProductLabel(record) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'type'">
          <a-tag :color="getFileTypeColor(record.mimeType)">
            {{ getFileTypeLabel(record.mimeType) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'size'">
          {{ formatFileSize(record.fileSize) }}
        </template>
        <template v-else-if="column.key === 'time'">
          {{ dayjs(record.createdAt).format('YYYY-MM-DD HH:mm') }}
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space size="small">
            <a-button size="small" type="link" @click="handleDownload(record)">
              <DownloadOutlined /> 下载
            </a-button>
            <a-button v-if="!isSales" size="small" type="link" danger @click="handleDelete(record)">
              <DeleteOutlined /> 删除
            </a-button>
          </a-space>
        </template>
      </template>

      <template #emptyText>
        <a-empty description="暂无文档">
          <span v-if="!isSales" style="color: #8c8c8c">点击上方按钮上传文档</span>
        </a-empty>
      </template>
    </a-table>

    <div style="margin-top: 12px; text-align: right; color: #8c8c8c">
      共 {{ documents.length }} 个文档
    </div>
  </a-modal>
</template>