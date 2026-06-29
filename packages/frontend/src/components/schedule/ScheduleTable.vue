<script setup lang="ts">
import { computed } from 'vue';
import {
  DeleteOutlined,
  EditOutlined,
  BellOutlined,
  CheckCircleOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue';
import type { TableColumnsType } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { ScheduleItem } from '@/types/api';
import { EVENT_TYPE_COLORS, EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '@/utils/constants';
import { EventType } from '@/types/schedule';
import { useUiStore } from '@/stores/ui.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useProductStore } from '@/stores/product.store';
import { useAuthStore } from '@/stores/auth.store';
import { scheduleEventApi } from '@/api/schedule-event.api';
import { reminderEventApi } from '@/api/reminder-event.api';
import { Modal, message } from 'ant-design-vue';

const props = defineProps<{
  items: ScheduleItem[];
  loading: boolean;
  showCompleted: boolean;
}>();

const emit = defineEmits(['tab-change']);

void props;
void emit;

const uiStore = useUiStore();
const dashboardStore = useDashboardStore();
const productStore = useProductStore();
const authStore = useAuthStore();

function getEventTypeLabel(eventType: string): string {
  if (eventType === 'reminder') return '提醒';
  return EVENT_TYPE_LABELS[eventType as EventType] || eventType;
}

function getEventIcon(eventType: string): string {
  return EVENT_TYPE_ICONS[eventType] || '📅';
}

function getEventColor(eventType: string): string {
  return EVENT_TYPE_COLORS[eventType] || '#8c8c8c';
}

function isPast(dateStr: string): boolean {
  return dayjs(dateStr).isBefore(dayjs(), 'day');
}

function isToday(dateStr: string): boolean {
  return dayjs(dateStr).isSame(dayjs(), 'day');
}

function handleCreateReminder(item: ScheduleItem) {
  if (item.type === 'schedule_event') {
    uiStore.openReminderForm(item.id);
  }
}

function handleEditSchedule(item: ScheduleItem) {
  if (item.type === 'schedule_event') {
    uiStore.openScheduleForm(item.productId, item.id);
  } else if (item.type === 'reminder_event') {
    uiStore.openReminderForm(item.scheduleEventId, item.id);
  }
}

async function handleDeleteSchedule(item: ScheduleItem) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除「${item.eventName}」吗？`,
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    onOk: async () => {
      try {
        if (item.type === 'schedule_event') {
          await scheduleEventApi.remove(item.id);
        } else if (item.type === 'reminder_event') {
          await reminderEventApi.remove(item.id);
        }
        dashboardStore.fetchSchedule(productStore.selectedProductId || undefined);
      } catch (e) {
        // error handled by interceptor
      }
    },
  });
}

async function handleTabChange(e: any) {
  dashboardStore.setShowCompleted(e.target.value);
  dashboardStore.fetchSchedule(productStore.selectedProductId || undefined);
}

async function handleToggleComplete(item: ScheduleItem) {
  try {
    if (item.type === 'schedule_event') {
      await scheduleEventApi.toggleComplete(item.id);
    } else if (item.type === 'reminder_event') {
      await reminderEventApi.toggleComplete(item.id);
    }
    const newState = !item.completed;
    message.success(newState ? '已标记为已完成' : '已设置为待办');
    dashboardStore.fetchSchedule(productStore.selectedProductId || undefined);
  } catch (e) {
    // error handled by interceptor
  }
}

const isOwner = computed(() => authStore.isRoot || authStore.isProductOwner);

const columns: TableColumnsType = [
  {
    title: '日期',
    dataIndex: 'date',
    key: 'date',
    width: 150,
    sorter: (a: ScheduleItem, b: ScheduleItem) =>
      new Date(a.date).getTime() - new Date(b.date).getTime(),
    defaultSortOrder: 'ascend',
  },
  {
    title: '产品',
    dataIndex: 'productName',
    key: 'productName',
    width: 150,
  },
  {
    title: '类型',
    dataIndex: 'eventType',
    key: 'eventType',
    width: 160,
  },
  {
    title: '名称',
    dataIndex: 'eventName',
    key: 'eventName',
    ellipsis: true,
  },
  {
    title: '关联事件',
    dataIndex: 'relatedEventName',
    key: 'relatedEventName',
    width: 200,
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'actions',
    width: 300,
  },
];
</script>

<template>
  <div>
    <!-- Tab buttons -->
    <div style="margin-bottom: 16px">
      <a-radio-group
        :value="showCompleted"
        button-style="solid"
        @change="emit('tab-change', $event)"
      >
        <a-radio-button :value="false">待办事件</a-radio-button>
        <a-radio-button :value="true">已完成事件</a-radio-button>
      </a-radio-group>
    </div>

    <a-table
      :columns="columns"
      :dataSource="items"
      :loading="loading"
      rowKey="id"
      :pagination="false"
      size="middle"
      bordered
    >
      <template #bodyCell="{ column, record }">
        <!-- 日期 -->
        <template v-if="column.key === 'date'">
          <span
            :style="{
              fontWeight: isToday(record.date) ? 700 : 500,
              color: isPast(record.date) ? '#bfbfbf' : isToday(record.date) ? '#1890ff' : undefined,
            }"
          >
            {{ dayjs(record.date).format('YYYY-MM-DD') }}
            <span v-if="isToday(record.date)" style="color: #1890ff">（今天）</span>
          </span>
        </template>

        <!-- 类型 -->
        <template v-else-if="column.key === 'eventType'">
          <a-tag :color="getEventColor(record.eventType)">
            {{ getEventIcon(record.eventType) }} {{ getEventTypeLabel(record.eventType) }}
          </a-tag>
        </template>

        <!-- 关联事件 -->
        <template v-else-if="column.key === 'relatedEventName'">
          {{ record.relatedEventName || '-' }}
        </template>

        <!-- 操作 -->
        <template v-else-if="column.key === 'actions'">
          <div class="action-cell">
            <!-- 待办事件 -->
            <template v-if="!showCompleted">
              <span class="action-slot">
                <a-button
                  v-if="isOwner && record.type === 'schedule_event'"
                  size="small"
                  type="link"
                  @click="handleCreateReminder(record)"
                >
                  <BellOutlined /> 创建提醒
                </a-button>
                <span v-else class="action-placeholder" />
              </span>
              <span class="action-slot">
                <a-button v-if="isOwner" size="small" type="link" @click="handleEditSchedule(record)">
                  <EditOutlined /> 编辑
                </a-button>
                <span v-else class="action-placeholder" />
              </span>
              <span class="action-slot">
                <a-button
                  v-if="isOwner"
                  size="small"
                  type="link"
                  @click="handleToggleComplete(record)"
                  style="color: #52c41a"
                >
                  <CheckCircleOutlined /> 完成
                </a-button>
                <span v-else class="action-placeholder" />
              </span>
            </template>

            <!-- 已完成事件 -->
            <template v-else>
              <span class="action-slot">
                <a-button
                  v-if="isOwner"
                  size="small"
                  type="link"
                  @click="handleToggleComplete(record)"
                >
                  <RedoOutlined /> 设置待办
                </a-button>
                <span v-else class="action-placeholder" />
              </span>
              <span class="action-slot">
                <a-button v-if="isOwner" size="small" type="link" danger @click="handleDeleteSchedule(record)">
                  <DeleteOutlined /> 删除
                </a-button>
                <span v-else class="action-placeholder" />
              </span>
            </template>
          </div>
        </template>
      </template>

      <template #emptyText>
        <a-empty :description="showCompleted ? '暂无已完成事件' : '暂无待办日程'">
          <a-button v-if="!showCompleted" type="primary" @click="uiStore.openProductForm()">
            创建产品
          </a-button>
        </a-empty>
      </template>
    </a-table>

    <div style="margin-top: 16px; text-align: right; color: #8c8c8c">
      共 {{ items.length }} 条{{ showCompleted ? '已完成' : '待办' }}日程/提醒
    </div>
  </div>
</template>

<style scoped>
.action-cell {
  display: flex;
  gap: 4px;
}
.action-slot {
  display: inline-flex;
  width: 80px;
  justify-content: center;
}
.action-placeholder {
  display: inline-block;
  width: 80px;
}
</style>