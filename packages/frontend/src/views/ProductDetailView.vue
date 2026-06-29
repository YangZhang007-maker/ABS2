<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeftOutlined,
  UploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  InboxOutlined,
  SearchOutlined,
  BellOutlined,
  EditOutlined,
  CheckCircleOutlined,
  RedoOutlined,
  ScheduleOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';
import { useProductStore } from '@/stores/product.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import { useUiStore } from '@/stores/ui.store';
import { scheduleEventApi } from '@/api/schedule-event.api';
import { reminderEventApi } from '@/api/reminder-event.api';
import { documentApi } from '@/api/document.api';
import { dashboardApi } from '@/api/dashboard.api';
import { EVENT_TYPE_COLORS, EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '@/utils/constants';
import EventDocumentModal from '@/components/document/EventDocumentModal.vue';
import type { ScheduleItem } from '@/types/api';
import type { DocumentItem } from '@/types/document';
import type { TableColumnsType } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const dashboardStore = useDashboardStore();
const authStore = useAuthStore();
const uiStore = useUiStore();

// Refresh events when modals close
watch(
  () => [uiStore.scheduleFormVisible, uiStore.reminderFormVisible],
  ([scheduleVisible, reminderVisible]) => {
    if (!scheduleVisible && !reminderVisible) {
      fetchEvents();
    }
  },
);

const productId = route.params.id as string;
const product = ref(productStore.products.find(p => p.id === productId));

const showCompleted = ref(false);
const eventLoading = ref(false);
const scheduleItems = ref<ScheduleItem[]>([]);
const eventTotal = ref(0);
const eventPage = ref(1);
const eventPageSize = 10;

const eventPagination = computed(() => ({
  current: eventPage.value,
  total: eventTotal.value,
  pageSize: eventPageSize,
  showSizeChanger: false,
  showTotal: (total: number) => `共 ${total} 条`,
  onChange: (page: number) => handleEventPageChange(page),
}));

// Document state
const docLoading = ref(false);
const documents = ref<DocumentItem[]>([]);
const uploading = ref(false);
const searchQuery = ref('');

const isOwner = authStore.isRoot || authStore.isProductOwner;

// Event document modal state
const eventDocVisible = ref(false);
const eventDocProductId = ref('');
const eventDocScheduleEventId = ref('');
const eventDocScheduleEventName = ref('');

function handleOpenEventDocs(item: ScheduleItem) {
  eventDocProductId.value = item.productId;
  eventDocScheduleEventId.value = item.id;
  eventDocScheduleEventName.value = item.eventName;
  eventDocVisible.value = true;
}

onMounted(async () => {
  if (!product.value) {
    await productStore.fetchProducts();
    product.value = productStore.products.find(p => p.id === productId);
  }
  fetchEvents();
  fetchDocuments();
});

async function fetchEvents() {
  eventLoading.value = true;
  try {
    const data = await dashboardApi.getSchedule(productId, showCompleted.value, undefined, eventPage.value, eventPageSize);
    scheduleItems.value = data.items;
    eventTotal.value = data.total;
  } finally {
    eventLoading.value = false;
  }
}

function handleEventPageChange(page: number) {
  eventPage.value = page;
  fetchEvents();
}

async function fetchDocuments() {
  docLoading.value = true;
  try {
    documents.value = await documentApi.list(productId);
  } catch (e) {
    console.error(e);
  } finally {
    docLoading.value = false;
  }
}

async function handleSearchDocs() {
  if (!searchQuery.value.trim()) {
    fetchDocuments();
    return;
  }
  docLoading.value = true;
  try {
    documents.value = (await documentApi.search(searchQuery.value.trim(), productId)).items;
  } catch {
    // handled
  } finally {
    docLoading.value = false;
  }
}

async function handleUploadDoc(options: any) {
  uploading.value = true;
  try {
    await documentApi.upload(productId, options.file);
    message.success('文件上传成功');
    await fetchDocuments();
    options.onSuccess();
  } catch (e: any) {
    options.onError(e);
  } finally {
    uploading.value = false;
  }
}

function handleDownloadDoc(doc: DocumentItem) {
  const url = documentApi.getDownloadUrl(productId, doc.id);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.originalName;
  a.click();
}

function handleDeleteDoc(doc: DocumentItem) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除文档「${doc.originalName}」吗？`,
    okText: '确认删除',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      await documentApi.remove(productId, doc.id);
      message.success('文档已删除');
      await fetchDocuments();
    },
  });
}

async function handleToggleComplete(item: ScheduleItem) {
  try {
    if (item.type === 'schedule_event') {
      await scheduleEventApi.toggleComplete(item.id);
    } else {
      await reminderEventApi.toggleComplete(item.id);
    }
    message.success(item.completed ? '已设置为待办' : '已标记为已完成');
    eventPage.value = 1;
    fetchEvents();
    dashboardStore.fetchSchedule(productStore.selectedProductId || undefined);
  } catch {}
}

function handleCreateReminder(item: ScheduleItem) {
  if (item.type === 'schedule_event') {
    uiStore.openReminderForm(item.id);
  }
}

function handleEdit(item: ScheduleItem) {
  if (item.type === 'schedule_event') {
    uiStore.openScheduleForm(item.productId, item.id);
  } else {
    uiStore.openReminderForm(item.scheduleEventId, item.id);
  }
}

function handleTabChange(e: any) {
  showCompleted.value = e.target.value;
  eventPage.value = 1;
  fetchEvents();
}

function isEstablishmentOrPayment(item: ScheduleItem): boolean {
  return item.type === 'schedule_event' && (item.eventType === 'establishment' || item.eventType === 'payment');
}

function getEventTypeLabel(t: string) {
  if (t === 'reminder') return '提醒';
  return EVENT_TYPE_LABELS[t] || t;
}
function getEventIcon(t: string) { return EVENT_TYPE_ICONS[t] || '📅'; }
function getEventColor(t: string) { return EVENT_TYPE_COLORS[t] || '#8c8c8c'; }
function isToday(d: string) { return dayjs(d).isSame(dayjs(), 'day'); }
function isPast(d: string) { return dayjs(d).isBefore(dayjs(), 'day'); }
function formatSize(b: number) {
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}
function getDocIcon(m: string) {
  if (m.includes('pdf')) return FilePdfOutlined;
  if (m.includes('word')) return FileWordOutlined;
  if (m.includes('excel')) return FileExcelOutlined;
  return InboxOutlined;
}
function getDocColor(m: string) {
  if (m.includes('pdf')) return '#ff4d4f';
  if (m.includes('word')) return '#1677ff';
  if (m.includes('excel')) return '#52c41a';
  return '#8c8c8c';
}
function getDocLabel(m: string) {
  if (m.includes('pdf')) return 'PDF';
  if (m.includes('word')) return 'Word';
  if (m.includes('excel')) return 'Excel';
  return '其他';
}

const eventCols: TableColumnsType = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 140, sorter: (a: ScheduleItem, b: ScheduleItem) => new Date(a.date).getTime() - new Date(b.date).getTime(), defaultSortOrder: 'ascend' },
  { title: '类型', key: 'type', width: 160 },
  { title: '名称', dataIndex: 'eventName', key: 'name', ellipsis: true },
  { title: '关联事件', dataIndex: 'relatedEventName', key: 'related', width: 180, ellipsis: true },
  { title: '操作', key: 'actions', width: showCompleted.value ? 150 : 320 },
];

const docCols: TableColumnsType = [
  { title: '文件名', key: 'docName', width: 260 },
  { title: '类型', key: 'docType', width: 80 },
  { title: '大小', key: 'docSize', width: 100 },
  { title: '上传时间', dataIndex: 'createdAt', key: 'docTime', width: 170 },
  { title: '操作', key: 'docActions', width: 140 },
];
</script>

<template>
  <div>
    <!-- Header -->
    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 24px">
      <a-button type="text" @click="router.push('/products')">
        <ArrowLeftOutlined /> 返回
      </a-button>
      <h2 style="margin: 0">{{ product?.name || '产品详情' }}</h2>
      <a-tag v-if="product" color="blue">{{ product.creator }}</a-tag>
    </div>

    <!-- Events Section -->
    <a-card title="日程与提醒事件" style="margin-bottom: 24px">
      <template #extra>
        <a-space>
          <a-button v-if="isOwner" type="primary" size="small" @click="uiStore.openScheduleForm(productId)">
            <ScheduleOutlined /> 创建日程
          </a-button>
          <a-radio-group :value="showCompleted" button-style="solid" @change="handleTabChange">
            <a-radio-button :value="false">待办事件</a-radio-button>
            <a-radio-button :value="true">已完成事件</a-radio-button>
          </a-radio-group>
        </a-space>
      </template>

      <a-table
        :columns="eventCols"
        :dataSource="scheduleItems"
        :loading="eventLoading"
        rowKey="id"
        :pagination="eventPagination"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'date'">
            <span :style="{ fontWeight: isToday(record.date) ? 700 : 500, color: isPast(record.date) ? '#bfbfbf' : isToday(record.date) ? '#1890ff' : undefined }">
              {{ dayjs(record.date).format('YYYY-MM-DD') }}
              <span v-if="isToday(record.date)" style="color: #1890ff">（今天）</span>
            </span>
          </template>
          <template v-else-if="column.key === 'type'">
            <a-tag :color="getEventColor(record.eventType)">{{ getEventIcon(record.eventType) }} {{ getEventTypeLabel(record.eventType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'related'">{{ record.relatedEventName || '-' }}</template>
          <template v-else-if="column.key === 'actions'">
            <div class="action-cell">
              <template v-if="!showCompleted">
                <span class="action-slot">
                  <a-button v-if="isOwner && isEstablishmentOrPayment(record)" size="small" type="link" style="color: #722ed1" @click="handleOpenEventDocs(record)"><FileTextOutlined /> 文档</a-button>
                  <span v-else class="action-placeholder" />
                </span>
                <span class="action-slot">
                  <a-button v-if="isOwner && record.type === 'schedule_event'" size="small" type="link" @click="handleCreateReminder(record)"><BellOutlined /> 创建提醒</a-button>
                  <span v-else class="action-placeholder" />
                </span>
                <span class="action-slot">
                  <a-button v-if="isOwner" size="small" type="link" @click="handleEdit(record)"><EditOutlined /> 编辑</a-button>
                  <span v-else class="action-placeholder" />
                </span>
                <span class="action-slot">
                  <a-button v-if="isOwner" size="small" type="link" style="color: #52c41a" @click="handleToggleComplete(record)"><CheckCircleOutlined /> 完成</a-button>
                  <span v-else class="action-placeholder" />
                </span>
              </template>
              <template v-else>
                <span class="action-slot">
                  <a-button v-if="isOwner" size="small" type="link" @click="handleToggleComplete(record)"><RedoOutlined /> 设置待办</a-button>
                  <span v-else class="action-placeholder" />
                </span>
              </template>
            </div>
          </template>
        </template>
        <template #emptyText>
          <a-empty :description="showCompleted ? '暂无已完成事件' : '暂无待办事件'" />
        </template>
      </a-table>
    </a-card>

    <!-- Documents Section -->
    <a-card title="产品文档">
      <template #extra>
        <div style="display: flex; gap: 8px">
          <a-input-search
            v-model:value="searchQuery"
            placeholder="搜索文档..."
            style="width: 220px"
            @search="handleSearchDocs"
          >
            <template #prefix><SearchOutlined /></template>
          </a-input-search>
          <a-upload
            v-if="isOwner"
            :customRequest="handleUploadDoc"
            :showUploadList="false"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          >
            <a-button type="primary" size="small" :loading="uploading">
              <UploadOutlined /> 上传
            </a-button>
          </a-upload>
        </div>
      </template>

      <a-table
        :columns="docCols"
        :dataSource="documents"
        :loading="docLoading"
        rowKey="id"
        :pagination="false"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'docName'">
            <component :is="getDocIcon(record.mimeType)" :style="{ color: getDocColor(record.mimeType), marginRight: '8px', fontSize: '16px' }" />
            {{ record.originalName }}
          </template>
          <template v-else-if="column.key === 'docType'">
            <a-tag :color="getDocColor(record.mimeType)">{{ getDocLabel(record.mimeType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'docSize'">{{ formatSize(record.fileSize) }}</template>
          <template v-else-if="column.key === 'docTime'">{{ dayjs(record.createdAt).format('YYYY-MM-DD HH:mm') }}</template>
          <template v-else-if="column.key === 'docActions'">
            <a-space size="small">
              <a-button size="small" type="link" @click="handleDownloadDoc(record)"><DownloadOutlined /> 下载</a-button>
              <a-button v-if="isOwner" size="small" type="link" danger @click="handleDeleteDoc(record)"><DeleteOutlined /> 删除</a-button>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无文档">
            <span v-if="isOwner" style="color: #8c8c8c">点击"上传"按钮添加文档</span>
          </a-empty>
        </template>
      </a-table>
    </a-card>

    <!-- Event Document Modal -->
    <EventDocumentModal
      :open="eventDocVisible"
      @update:open="eventDocVisible = $event"
      :productId="eventDocProductId"
      :productName="product?.name || ''"
      :scheduleEventName="eventDocScheduleEventName"
      :scheduleEventId="eventDocScheduleEventId"
      :isOwner="isOwner"
    />
  </div>
</template>

<style scoped>
.action-cell { display: flex; gap: 4px; }
.action-slot { display: inline-flex; width: 80px; justify-content: center; }
.action-placeholder { display: inline-block; width: 80px; }
</style>