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
  scheduleEventName: string;
  scheduleEventId: string;
  isOwner: boolean;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const documents = ref<DocumentItem[]>([]);
const loading = ref(false);
const uploading = ref(false);

async function fetchDocuments() {
  if (!props.productId || !props.scheduleEventId) return;
  loading.value = true;
  try {
    documents.value = await documentApi.listByEvent(props.productId, props.scheduleEventId);
  } catch (e) {
    console.error('获取文档列表失败:', e);
  } finally {
    loading.value = false;
  }
}

watch(() => props.open, (visible) => {
  if (visible) {
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

async function handleUpload(options: any) {
  uploading.value = true;
  try {
    await documentApi.uploadToEvent(props.productId, props.scheduleEventId, options.file);
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
    content: `确定要删除文档「${doc.originalName}」吗？`,
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
  { title: '文件名', key: 'name', width: 260 },
  { title: '类型', key: 'type', width: 80 },
  { title: '大小', dataIndex: 'fileSize', key: 'size', width: 100 },
  { title: '上传时间', dataIndex: 'createdAt', key: 'time', width: 170 },
  { title: '操作', key: 'actions', width: 150 },
];
</script>

<template>
  <a-modal
    :open="open"
    title="事件文档"
    @cancel="handleClose"
    :footer="null"
    width="800px"
    :destroyOnClose="true"
  >
    <div style="margin-bottom: 12px; display: flex; gap: 16px; align-items: center">
      <span style="color: #8c8c8c">产品：<strong style="color: #333">{{ productName }}</strong></span>
      <span style="color: #8c8c8c">事件：<strong style="color: #333">{{ scheduleEventName }}</strong></span>
    </div>

    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px">
      <a-upload
        v-if="isOwner"
        :customRequest="handleUpload"
        :showUploadList="false"
        accept=".pdf,.doc,.docx,.xls,.xlsx"
      >
        <a-button type="primary" :loading="uploading">
          <template #icon><UploadOutlined /></template>
          上传文档
        </a-button>
      </a-upload>
      <span v-if="isOwner" style="color: #8c8c8c; font-size: 12px">
        支持 PDF、Word、Excel，单个 ≤50MB
      </span>
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
            <a-button v-if="isOwner" size="small" type="link" danger @click="handleDelete(record)">
              <DeleteOutlined /> 删除
            </a-button>
          </a-space>
        </template>
      </template>

      <template #emptyText>
        <a-empty description="暂无文档">
          <span v-if="isOwner" style="color: #8c8c8c">点击"上传文档"按钮添加</span>
        </a-empty>
      </template>
    </a-table>

    <div style="margin-top: 12px; text-align: right; color: #8c8c8c">
      共 {{ documents.length }} 个文档
    </div>
  </a-modal>
</template>