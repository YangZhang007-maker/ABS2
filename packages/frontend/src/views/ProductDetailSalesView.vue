<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  InboxOutlined,
  FileTextOutlined,
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import dayjs from 'dayjs';
import { useProductStore } from '@/stores/product.store';
import { useAuthStore } from '@/stores/auth.store';
import { documentApi } from '@/api/document.api';
import { dashboardApi } from '@/api/dashboard.api';
import { EVENT_TYPE_COLORS, EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '@/utils/constants';
import type { ScheduleItem } from '@/types/api';
import type { DocumentItem } from '@/types/document';
import type { TableColumnsType } from 'ant-design-vue';

const route = useRoute();
const router = useRouter();
const productStore = useProductStore();
const authStore = useAuthStore();

const productId = route.params.id as string;
const product = ref(productStore.products.find(p => p.id === productId));

const eventLoading = ref(false);
const establishmentAndPaymentItems = ref<ScheduleItem[]>([]);

// Document modal state
const docModalVisible = ref(false);
const docModalEventId = ref('');
const docModalEventName = ref('');
const docModalDocs = ref<DocumentItem[]>([]);
const docModalLoading = ref(false);

onMounted(async () => {
  if (!product.value) {
    await productStore.fetchProducts();
    product.value = productStore.products.find(p => p.id === productId);
  }
  fetchEvents();
});

async function fetchEvents() {
  eventLoading.value = true;
  try {
    // Get all events (pending only), then filter for establishment & payment
    const data = await dashboardApi.getSchedule(productId, false, undefined, 1, 999);
    establishmentAndPaymentItems.value = data.items.filter(
      item => item.type === 'schedule_event' &&
        (item.eventType === 'establishment' || item.eventType === 'payment')
    );
  } finally {
    eventLoading.value = false;
  }
}

function getEventTypeLabel(t: string) {
  return EVENT_TYPE_LABELS[t] || t;
}
function getEventIcon(t: string) { return EVENT_TYPE_ICONS[t] || '📅'; }
function getEventColor(t: string) { return EVENT_TYPE_COLORS[t] || '#8c8c8c'; }
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

async function handleOpenDocs(item: ScheduleItem) {
  docModalEventId.value = item.id;
  docModalEventName.value = item.eventName;
  docModalVisible.value = true;
  await fetchEventDocs();
}

async function fetchEventDocs() {
  docModalLoading.value = true;
  try {
    docModalDocs.value = await documentApi.listByEvent(productId, docModalEventId.value);
  } catch (e) {
    console.error(e);
  } finally {
    docModalLoading.value = false;
  }
}

function handleDownload(doc: DocumentItem) {
  const url = documentApi.getDownloadUrl(productId, doc.id);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.originalName;
  a.click();
}

function isToday(d: string) { return dayjs(d).isSame(dayjs(), 'day'); }
function isPast(d: string) { return dayjs(d).isBefore(dayjs(), 'day'); }

const eventCols: TableColumnsType = [
  { title: '日期', dataIndex: 'date', key: 'date', width: 140, sorter: (a: ScheduleItem, b: ScheduleItem) => new Date(a.date).getTime() - new Date(b.date).getTime(), defaultSortOrder: 'ascend' },
  { title: '类型', key: 'type', width: 160 },
  { title: '名称', dataIndex: 'eventName', key: 'name', ellipsis: true },
  { title: '操作', key: 'actions', width: 100 },
];

const docCols: TableColumnsType = [
  { title: '文件名', key: 'docName', width: 260 },
  { title: '类型', key: 'docType', width: 80 },
  { title: '大小', key: 'docSize', width: 100 },
  { title: '上传时间', dataIndex: 'createdAt', key: 'docTime', width: 170 },
  { title: '操作', key: 'docActions', width: 80 },
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
    <a-card title="设立日 & 兑付日">
      <a-table
        :columns="eventCols"
        :dataSource="establishmentAndPaymentItems"
        :loading="eventLoading"
        rowKey="id"
        :pagination="false"
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
          <template v-else-if="column.key === 'actions'">
            <a-button size="small" type="link" style="color: #722ed1" @click="handleOpenDocs(record)">
              <FileTextOutlined /> 文档
            </a-button>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无设立日或兑付日事件" />
        </template>
      </a-table>
    </a-card>

    <!-- Document Modal (read-only for sales) -->
    <a-modal
      :open="docModalVisible"
      title="事件文档"
      @cancel="docModalVisible = false"
      :footer="null"
      width="700px"
      :destroyOnClose="true"
    >
      <div style="margin-bottom: 12px">
        <span style="color: #8c8c8c">产品：<strong style="color: #333">{{ product?.name }}</strong></span>
        <span style="margin-left: 16px; color: #8c8c8c">事件：<strong style="color: #333">{{ docModalEventName }}</strong></span>
      </div>

      <a-table
        :columns="docCols"
        :dataSource="docModalDocs"
        :loading="docModalLoading"
        rowKey="id"
        :pagination="false"
        size="middle"
        bordered
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'docName'">
            <component :is="getDocIcon(record.mimeType)" :style="{ color: getDocColor(record.mimeType), marginRight: '8px', fontSize: '18px' }" />
            {{ record.originalName }}
          </template>
          <template v-else-if="column.key === 'docType'">
            <a-tag :color="getDocColor(record.mimeType)">{{ getDocLabel(record.mimeType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'docSize'">{{ formatSize(record.fileSize) }}</template>
          <template v-else-if="column.key === 'docTime'">{{ dayjs(record.createdAt).format('YYYY-MM-DD HH:mm') }}</template>
          <template v-else-if="column.key === 'docActions'">
            <a-button size="small" type="link" @click="handleDownload(record)">
              <DownloadOutlined /> 下载
            </a-button>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无文档" />
        </template>
      </a-table>

      <div style="margin-top: 12px; text-align: right; color: #8c8c8c">
        共 {{ docModalDocs.length }} 个文档
      </div>
    </a-modal>
  </div>
</template>