<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  LeftOutlined,
  RightOutlined,
  LeftCircleOutlined,
  RightCircleOutlined,
  BellOutlined,
  EditOutlined,
  CheckCircleOutlined,
  RedoOutlined,
  DeleteOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons-vue';
import { Modal, message } from 'ant-design-vue';
import dayjs from 'dayjs';
import type { ScheduleItem } from '@/types/api';
import { EVENT_TYPE_COLORS, EVENT_TYPE_ICONS, EVENT_TYPE_LABELS } from '@/utils/constants';
import { useUiStore } from '@/stores/ui.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useProductStore } from '@/stores/product.store';
import { useAuthStore } from '@/stores/auth.store';
import { scheduleEventApi } from '@/api/schedule-event.api';
import { reminderEventApi } from '@/api/reminder-event.api';

const MAX_VISIBLE = 4;
const PANEL_WIDTH = 340;

const props = defineProps<{
  items: ScheduleItem[];
  loading: boolean;
  showCompleted: boolean;
}>();

const emit = defineEmits(['tab-change', 'refresh']);

const uiStore = useUiStore();
const dashboardStore = useDashboardStore();
const productStore = useProductStore();
const authStore = useAuthStore();

// ---- Calendar state ----
const currentMonth = ref(dayjs());
const selectedDate = ref(dayjs().format('YYYY-MM-DD'));
const panelCollapsed = ref(false);

// ---- Hover tooltip ----
const hoveredEvent = ref<ScheduleItem | null>(null);
const hoverPos = ref({ x: 0, y: 0 });

// ---- Detail modal ----
const detailVisible = ref(false);
const detailEvent = ref<ScheduleItem | null>(null);

// ---- Overflow modal ----
const overflowVisible = ref(false);
const overflowDate = ref('');
const overflowEvents = ref<ScheduleItem[]>([]);

const isOwner = computed(() => authStore.isRoot || authStore.isProductOwner);

// ---- Events for selected date ----
const selectedDateEvents = computed(() =>
  props.items.filter((item) => dayjs(item.date).format('YYYY-MM-DD') === selectedDate.value),
);

// ---- Calendar days computation ----
const calendarDays = computed(() => {
  const startOfMonth = currentMonth.value.startOf('month');
  const endOfMonth = currentMonth.value.endOf('month');
  const startDay = startOfMonth.day();
  const daysInMonth = endOfMonth.date();
  const mondayOffset = startDay === 0 ? 6 : startDay - 1;

  const days: { date: string; isCurrentMonth: boolean; events: ScheduleItem[] }[] = [];

  for (let i = mondayOffset - 1; i >= 0; i--) {
    const d = startOfMonth.subtract(i + 1, 'day');
    days.push({ date: d.format('YYYY-MM-DD'), isCurrentMonth: false, events: [] });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const d = startOfMonth.date(i);
    const dateStr = d.format('YYYY-MM-DD');
    const dayEvents = props.items.filter((item) => dayjs(item.date).format('YYYY-MM-DD') === dateStr);
    days.push({ date: dateStr, isCurrentMonth: true, events: dayEvents });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      const d = endOfMonth.add(i, 'day');
      days.push({ date: d.format('YYYY-MM-DD'), isCurrentMonth: false, events: [] });
    }
  }

  return days;
});

const monthLabel = computed(() => currentMonth.value.format('YYYY年 M月'));
const selectedDateLabel = computed(() => dayjs(selectedDate.value).format('YYYY年M月D日 dddd'));

function prevMonth() {
  currentMonth.value = currentMonth.value.subtract(1, 'month');
}

function nextMonth() {
  currentMonth.value = currentMonth.value.add(1, 'month');
}

function goToday() {
  currentMonth.value = dayjs();
  selectedDate.value = dayjs().format('YYYY-MM-DD');
}

function selectDate(dateStr: string) {
  selectedDate.value = dateStr;
}

function togglePanel() {
  panelCollapsed.value = !panelCollapsed.value;
}

// ---- Event helpers ----
function getEventTypeLabel(t: string): string {
  if (t === 'reminder') return '提醒';
  return EVENT_TYPE_LABELS[t] || t;
}

function getEventIcon(t: string) { return EVENT_TYPE_ICONS[t] || '📅'; }
function getEventColor(t: string) { return EVENT_TYPE_COLORS[t] || '#8c8c8c'; }
function getDotColor(t: string) { return EVENT_TYPE_COLORS[t] || '#8c8c8c'; }
function truncateText(text: string, maxLen: number): string {
  return text.length > maxLen ? text.slice(0, maxLen) + '…' : text;
}

// ---- Hover ----
function handleEventMouseEnter(e: MouseEvent, item: ScheduleItem) {
  hoveredEvent.value = item;
  hoverPos.value = { x: e.clientX + 12, y: e.clientY + 12 };
}

function handleEventMouseLeave() {
  hoveredEvent.value = null;
}

// ---- Click event chip → detail modal ----
function handleEventClick(item: ScheduleItem) {
  detailEvent.value = item;
  detailVisible.value = true;
}

// ---- More overflow ----
function handleMoreClick(day: { date: string; events: ScheduleItem[] }) {
  overflowDate.value = day.date;
  overflowEvents.value = day.events;
  overflowVisible.value = true;
}

// ---- Actions ----
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

async function handleToggleComplete(item: ScheduleItem) {
  try {
    if (item.type === 'schedule_event') {
      await scheduleEventApi.toggleComplete(item.id);
    } else {
      await reminderEventApi.toggleComplete(item.id);
    }
    message.success(item.completed ? '已设置为待办' : '已标记为已完成');
    emit('refresh');
  } catch {}
}

async function handleDelete(item: ScheduleItem) {
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
        } else {
          await reminderEventApi.remove(item.id);
        }
        message.success('已删除');
        detailVisible.value = false;
        overflowVisible.value = false;
        emit('refresh');
      } catch {}
    },
  });
}

function isToday(dateStr: string): boolean {
  return dayjs(dateStr).isSame(dayjs(), 'day');
}

function isSelected(dateStr: string): boolean {
  return dateStr === selectedDate.value;
}

const DAY_NAMES = ['一', '二', '三', '四', '五', '六', '日'];

const overflowCols = [
  { title: '事件名称', dataIndex: 'eventName', key: 'name', ellipsis: true },
  { title: '产品', dataIndex: 'productName', key: 'product', width: 100 },
  { title: '类型', key: 'type', width: 120 },
  { title: '操作', key: 'actions', width: 180 },
];
</script>

<template>
  <div class="calendar-wrapper">
    <!-- ========== LEFT: Calendar area ========== -->
    <div class="calendar-main" :class="{ 'panel-open': !panelCollapsed }">
      <a-spin :spinning="loading" wrapperClassName="calendar-spin-wrapper">
      <!-- Header row -->
      <div class="calendar-header">
        <a-radio-group :value="showCompleted" button-style="solid" size="small" @change="emit('tab-change', $event)">
          <a-radio-button :value="false">待办事件</a-radio-button>
          <a-radio-button :value="true">已完成事件</a-radio-button>
        </a-radio-group>
        <div class="calendar-nav">
          <a-button size="small" type="text" @click="prevMonth"><LeftOutlined /></a-button>
          <span class="month-label">{{ monthLabel }}</span>
          <a-button size="small" type="text" @click="nextMonth"><RightOutlined /></a-button>
          <a-button size="small" type="link" @click="goToday">今天</a-button>
        </div>
      </div>

      <!-- Unified calendar grid: day names + body in one grid for perfect alignment -->
      <div class="calendar-grid">
        <!-- Day name row -->
        <div v-for="name in DAY_NAMES" :key="'h-' + name" class="day-name-cell">{{ name }}</div>
        <!-- Day cells -->
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="day-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            'is-today': isToday(day.date),
            'is-selected': isSelected(day.date),
          }"
          @click="selectDate(day.date)"
        >
          <div class="day-number">{{ dayjs(day.date).date() }}</div>
          <div class="day-events">
            <div
              v-for="event in day.events.slice(0, MAX_VISIBLE)"
              :key="event.id"
              class="event-chip"
              :class="{ 'reminder-chip': event.eventType === 'reminder' }"
              :style="{ borderLeftColor: getDotColor(event.eventType) }"
              @mouseenter="(e: MouseEvent) => handleEventMouseEnter(e, event)"
              @mouseleave="handleEventMouseLeave"
              @click.stop="handleEventClick(event)"
            >
              <span class="event-dot" :style="{ background: getDotColor(event.eventType) }"></span>
              <span class="event-text">{{ truncateText(event.eventName, 10) }}</span>
            </div>
            <div v-if="day.events.length > MAX_VISIBLE" class="more-events" @click.stop="handleMoreClick(day)">
              +{{ day.events.length - MAX_VISIBLE }} 更多
            </div>
          </div>
        </div>
      </div>
      </a-spin>
    </div>

    <!-- ========== RIGHT: Day event panel ========== -->
    <!-- Toggle button -->
    <div class="panel-toggle" @click="togglePanel" :title="panelCollapsed ? '展开当日事件' : '收起当日事件'">
      <component :is="panelCollapsed ? LeftCircleOutlined : RightCircleOutlined" />
    </div>

    <div class="day-panel" v-show="!panelCollapsed">
      <div class="panel-header">
        <span class="panel-date">{{ selectedDateLabel }}</span>
        <a-tag v-if="isToday(selectedDate)" color="blue">今天</a-tag>
        <span class="panel-count">{{ selectedDateEvents.length }} 个事件</span>
      </div>

      <div class="panel-body">
        <template v-if="selectedDateEvents.length === 0">
          <a-empty description="该日暂无事件" style="margin-top: 40px" />
        </template>
        <div
          v-for="item in selectedDateEvents"
          :key="item.id"
          class="panel-event-row"
          :class="{ 'is-completed': item.completed }"
        >
          <div class="panel-event-left">
            <a-tag :color="getEventColor(item.eventType)" style="font-size: 11px; flex-shrink: 0">
              {{ getEventIcon(item.eventType) }} {{ getEventTypeLabel(item.eventType) }}
            </a-tag>
            <div class="panel-event-info">
              <div class="panel-event-name" :title="item.eventName">{{ item.eventName }}</div>
              <div class="panel-event-product">{{ item.productName }}</div>
            </div>
          </div>
          <div v-if="isOwner" class="panel-event-actions">
            <a-button
              size="small"
              type="link"
              :style="{ color: item.completed ? '#faad14' : '#52c41a' }"
              @click="handleToggleComplete(item)"
            >
              <component :is="item.completed ? RedoOutlined : CheckCircleOutlined" />
              {{ item.completed ? '待办' : '完成' }}
            </a-button>
            <a-button size="small" type="link" @click="handleEdit(item)">
              <EditOutlined />
            </a-button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- ========== Teleported tooltip ========== -->
  <Teleport to="body">
    <div v-if="hoveredEvent" class="hover-tooltip" :style="{ left: hoverPos.x + 'px', top: hoverPos.y + 'px' }">
      <div class="tooltip-event-name">{{ hoveredEvent.eventName }}</div>
      <div style="display: flex; gap: 6px; margin-top: 4px">
        <a-tag :color="getEventColor(hoveredEvent.eventType)" style="font-size: 11px">
          {{ getEventIcon(hoveredEvent.eventType) }} {{ getEventTypeLabel(hoveredEvent.eventType) }}
        </a-tag>
        <span style="font-size: 12px; color: #8c8c8c">{{ hoveredEvent.productName }}</span>
      </div>
      <div v-if="hoveredEvent.relatedEventName" style="font-size: 11px; color: #bfbfbf; margin-top: 2px">
        关联: {{ hoveredEvent.relatedEventName }}
      </div>
    </div>
  </Teleport>

  <!-- ========== Detail modal ========== -->
  <a-modal v-model:open="detailVisible" :title="detailEvent?.eventName || '事件详情'" :footer="null" width="520px" :destroyOnClose="true">
    <template v-if="detailEvent">
      <a-descriptions :column="1" size="small" bordered style="margin-bottom: 20px">
        <a-descriptions-item label="日期">
          <span :style="{ color: isToday(detailEvent.date) ? '#1890ff' : undefined, fontWeight: isToday(detailEvent.date) ? 700 : 500 }">
            {{ dayjs(detailEvent.date).format('YYYY-MM-DD') }}
            <span v-if="isToday(detailEvent.date)" style="color: #1890ff">（今天）</span>
          </span>
        </a-descriptions-item>
        <a-descriptions-item label="产品">{{ detailEvent.productName }}</a-descriptions-item>
        <a-descriptions-item label="类型">
          <a-tag :color="getEventColor(detailEvent.eventType)">
            {{ getEventIcon(detailEvent.eventType) }} {{ getEventTypeLabel(detailEvent.eventType) }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="名称">{{ detailEvent.eventName }}</a-descriptions-item>
        <a-descriptions-item v-if="detailEvent.relatedEventName" label="关联事件">{{ detailEvent.relatedEventName }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="detailEvent.completed ? 'default' : 'processing'">{{ detailEvent.completed ? '已完成' : '待办' }}</a-tag>
        </a-descriptions-item>
      </a-descriptions>
      <div v-if="isOwner" class="detail-actions">
        <a-space>
          <a-button v-if="detailEvent.type === 'schedule_event'" size="small" @click="handleCreateReminder(detailEvent)"><BellOutlined /> 创建提醒</a-button>
          <a-button size="small" @click="handleEdit(detailEvent)"><EditOutlined /> 去编辑</a-button>
          <a-button v-if="!detailEvent.completed" size="small" type="primary" @click="handleToggleComplete(detailEvent)"><CheckCircleOutlined /> 完成</a-button>
          <a-button v-else size="small" @click="handleToggleComplete(detailEvent)"><RedoOutlined /> 设置待办</a-button>
          <a-button v-if="detailEvent.completed" size="small" danger @click="handleDelete(detailEvent)"><DeleteOutlined /> 删除</a-button>
        </a-space>
      </div>
    </template>
  </a-modal>

  <!-- ========== Overflow modal ========== -->
  <a-modal v-model:open="overflowVisible" :title="`${overflowDate} 的全部事件（共 ${overflowEvents.length} 个）`" :footer="null" width="700px" :destroyOnClose="true">
    <a-table :columns="overflowCols" :dataSource="overflowEvents" :pagination="false" rowKey="id" size="small" bordered>
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'type'">
          <a-tag :color="getEventColor(record.eventType)" style="font-size: 11px">
            {{ getEventIcon(record.eventType) }} {{ getEventTypeLabel(record.eventType) }}
          </a-tag>
        </template>
        <template v-else-if="column.key === 'actions'">
          <a-space size="small">
            <a-button size="small" type="link" @click="handleEventClick(record)">详情</a-button>
            <a-button v-if="isOwner" size="small" type="link" @click="handleEdit(record)">编辑</a-button>
            <a-button v-if="isOwner && !record.completed" size="small" type="link" style="color: #52c41a" @click="handleToggleComplete(record)">完成</a-button>
            <a-button v-if="isOwner && record.completed" size="small" type="link" danger @click="handleDelete(record)">删除</a-button>
          </a-space>
        </template>
      </template>
    </a-table>
  </a-modal>
</template>

<style scoped>
/* ===== Wrapper ===== */
.calendar-wrapper {
  display: flex;
  gap: 0;
  align-items: flex-start;
  position: relative;
}

/* ===== Main calendar area ===== */
.calendar-main {
  flex: 1;
  min-width: 560px;
  overflow: hidden;
  transition: margin-right 0.25s ease;
}

/* ===== Panel toggle button ===== */
.panel-toggle {
  position: sticky;
  top: 12px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 48px;
  border-radius: 6px 0 0 6px;
  background: #f0f0f0;
  cursor: pointer;
  font-size: 16px;
  color: #666;
  flex-shrink: 0;
  transition: all 0.2s;
  margin-top: 52px;
}

.panel-toggle:hover {
  background: #d9d9d9;
  color: #1890ff;
}

/* ===== Day event panel ===== */
.day-panel {
  width: 340px;
  flex-shrink: 0;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
  max-height: calc(100vh - 200px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: sticky;
  top: 0;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.panel-date {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.panel-count {
  margin-left: auto;
  font-size: 12px;
  color: #8c8c8c;
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.panel-event-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 6px;
  margin-bottom: 4px;
  border: 1px solid #f5f5f5;
  transition: background 0.15s;
  gap: 8px;
}

.panel-event-row:hover {
  background: #fafafa;
}

.panel-event-row.is-completed {
  opacity: 0.6;
}

.panel-event-row.is-completed .panel-event-name {
  text-decoration: line-through;
}

.panel-event-left {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.panel-event-info {
  min-width: 0;
  flex: 1;
}

.panel-event-name {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.panel-event-product {
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 2px;
}

.panel-event-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

/* ===== Calendar header ===== */
.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.calendar-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.month-label {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  min-width: 110px;
  text-align: center;
}

/* ===== Grid ===== */
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-left: 1px solid #f0f0f0;
  border-top: 1px solid #f0f0f0;
  overflow: hidden;
}

.day-name-cell {
  padding: 8px;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  color: #666;
  background: #fafafa;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.day-cell {
  min-height: 100px;
  padding: 4px 6px;
  border-right: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  background: #fff;
  cursor: pointer;
  transition: background 0.15s;
}

.day-cell.other-month {
  background: #fafafa;
  color: #d9d9d9;
}

.day-cell.is-today {
  background: #e6f7ff;
}

.day-cell.is-selected {
  outline: 2px solid #1890ff;
  outline-offset: -2px;
  background: #e6f7ff;
}

.day-cell.is-selected .day-number {
  color: #1890ff;
  font-weight: 700;
}

.day-cell.is-today .day-number {
  color: #1890ff;
  font-weight: 700;
}

.day-number {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.other-month .day-number {
  color: #d9d9d9;
}

.day-events {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.event-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 1px 4px;
  border-radius: 3px;
  border-left: 3px solid #1890ff;
  background: #fafafa;
  cursor: pointer;
  transition: background 0.15s;
  overflow: hidden;
}

.event-chip:hover {
  background: #e6f7ff;
}

.reminder-chip {
  border-left-style: dashed;
}

.event-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-text {
  font-size: 11px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.more-events {
  font-size: 11px;
  color: #1890ff;
  cursor: pointer;
  padding: 1px 4px;
  border-radius: 3px;
}

.more-events:hover {
  background: #e6f7ff;
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}
</style>

<style>
/* Global styles for teleported tooltip */
.hover-tooltip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 8px 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  max-width: 280px;
}

.tooltip-event-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>