<script setup lang="ts">
import { reactive, ref, watch, computed, nextTick } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import { useUiStore } from '@/stores/ui.store';
import { useProductStore } from '@/stores/product.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { DateMode, RefType } from '@/common/enums/date-mode.enum';
import { reminderEventApi } from '@/api/reminder-event.api';
import { scheduleEventApi } from '@/api/schedule-event.api';
import type { ScheduleEvent } from '@/types/schedule';

const uiStore = useUiStore();
const productStore = useProductStore();
const dashboardStore = useDashboardStore();

const formRef = ref();
const submitting = ref(false);
const scheduleEvents = ref<ScheduleEvent[]>([]);
const loadingEvents = ref(false);

// Flag to prevent the productId watcher from clearing scheduleEventId during init
let isInitializing = false;

const formState = reactive({
  productId: '' as string,
  scheduleEventId: '' as string,
  reminderName: '',
  dateMode: DateMode.RELATIVE as 'relative' | 'manual',
  refType: RefType.T as 'T' | 'R',
  offsetDays: 7,
  manualDate: null as Dayjs | null,
});

const title = computed(() => (uiStore.editingReminderId ? '编辑提醒事件' : '创建提醒事件'));

const selectedScheduleEvent = computed(() =>
  scheduleEvents.value.find((e) => e.id === formState.scheduleEventId),
);

const triggerDatePreview = computed(() => {
  const event = selectedScheduleEvent.value;
  if (!event) return '请先选择日程事件';

  if (formState.dateMode === DateMode.RELATIVE) {
    const baseDate = dayjs(event.eventDate);
    const resultDate = baseDate.subtract(formState.offsetDays, 'day');
    return resultDate.format('YYYY-MM-DD') + '（' + event.scheduleName + ' 前 ' + formState.offsetDays + ' 天）';
  } else if (formState.dateMode === DateMode.MANUAL && formState.manualDate) {
    return formState.manualDate.format('YYYY-MM-DD') + '（手动选择）';
  }
  return '请先选择提醒方式';
});

// Load schedule events for a product (user-initiated, not during init)
async function loadScheduleEvents(productId: string) {
  if (!productId) {
    scheduleEvents.value = [];
    if (!isInitializing) formState.scheduleEventId = '';
    return;
  }
  loadingEvents.value = true;
  try {
    scheduleEvents.value = await scheduleEventApi.listByProduct(productId);
    if (!isInitializing) formState.scheduleEventId = '';
  } catch (e) {
    console.error('加载日程事件失败:', e);
    scheduleEvents.value = [];
  } finally {
    loadingEvents.value = false;
  }
}

// Watch product changes to load events (only when user manually changes product)
watch(() => formState.productId, (pid, oldPid) => {
  if (pid !== oldPid && !isInitializing) {
    loadScheduleEvents(pid);
  }
});

// When dialog opens, initialize state
watch(
  () => uiStore.reminderFormVisible,
  async (visible) => {
    if (!visible) return;

    isInitializing = true;

    // Reset everything
    scheduleEvents.value = [];
    formState.productId = '';
    formState.scheduleEventId = '';
    formState.reminderName = '';
    formState.dateMode = DateMode.RELATIVE;
    formState.refType = RefType.T;
    formState.offsetDays = 7;
    formState.manualDate = null;

    const preselectedSid = uiStore.reminderFormScheduleEventId;

    if (preselectedSid) {
      // Opened from schedule row — find the product and event, pre-fill selections
      loadingEvents.value = true;
      try {
        for (const p of productStore.products) {
          const events = await scheduleEventApi.listByProduct(p.id);
          const found = events.find((e) => e.id === preselectedSid);
          if (found) {
            scheduleEvents.value = events;
            formState.productId = p.id;
            formState.scheduleEventId = preselectedSid;
            break;
          }
        }
      } catch (e) {
        console.error('预加载日程失败:', e);
      } finally {
        loadingEvents.value = false;
      }
    } else {
      // Opened from header — auto-select first product
      if (productStore.products.length > 0) {
        formState.productId = productStore.products[0].id;
      }
    }

    // Clear validation after state is set
    await nextTick();
    formRef.value?.clearValidate();

    // Unblock the productId watcher
    isInitializing = false;
  },
  { immediate: true },
);

async function handleSubmit() {
  try {
    await formRef.value?.validateFields();

    if (!formState.scheduleEventId) {
      message.warning('请先选择产品和日程事件');
      return;
    }

    submitting.value = true;

    if (formState.dateMode === DateMode.RELATIVE) {
      await reminderEventApi.create(formState.scheduleEventId, {
        reminderName: formState.reminderName,
        dateMode: DateMode.RELATIVE,
        refType: formState.refType,
        offsetDays: formState.offsetDays,
      });
    } else if (formState.dateMode === DateMode.MANUAL && formState.manualDate) {
      await reminderEventApi.create(formState.scheduleEventId, {
        reminderName: formState.reminderName,
        dateMode: DateMode.MANUAL,
        manualDate: formState.manualDate.toISOString(),
      });
    } else {
      message.warning('请选择提醒日期');
      return;
    }

    message.success('提醒事件已创建');
    uiStore.closeReminderForm();
    await dashboardStore.fetchSchedule(productStore.selectedProductId || undefined);
  } catch (e: any) {
    if (e?.errorFields?.length > 0) {
      message.warning(e.errorFields[0].errors?.[0] || '请检查表单填写');
      return;
    }
    console.error('提交失败:', e);
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  uiStore.closeReminderForm();
}
</script>

<template>
  <a-modal
    :open="uiStore.reminderFormVisible"
    :title="title"
    :confirmLoading="submitting"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :maskClosable="false"
    :destroyOnClose="true"
    width="560px"
  >
    <a-form
      ref="formRef"
      :model="formState"
      layout="vertical"
      style="margin-top: 16px"
    >
      <!-- Step 1: Select product -->
      <a-form-item
        label="选择产品"
        name="productId"
        :rules="[{ required: true, message: '请选择产品', trigger: 'change' }]"
      >
        <a-select
          v-model:value="formState.productId"
          placeholder="请选择产品"
        >
          <a-select-option
            v-for="product in productStore.products"
            :key="product.id"
            :value="product.id"
          >
            {{ product.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- Step 2: Select schedule event -->
      <a-form-item
        label="选择日程事件"
        name="scheduleEventId"
        :rules="[{ required: true, message: '请选择日程事件', trigger: 'change' }]"
      >
        <a-select
          v-model:value="formState.scheduleEventId"
          placeholder="请先选择产品，再选择日程事件"
          :loading="loadingEvents"
        >
          <a-select-option
            v-for="event in scheduleEvents"
            :key="event.id"
            :value="event.id"
          >
            {{ event.scheduleName }}（{{ dayjs(event.eventDate).format('YYYY-MM-DD') }}）
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-divider />

      <!-- Step 3: Reminder name -->
      <a-form-item
        label="提醒事件名称"
        name="reminderName"
        :rules="[{ required: true, message: '请输入提醒事件名称', trigger: 'blur' }]"
      >
        <a-input
          v-model:value="formState.reminderName"
          placeholder="如：兑付日前7天提醒"
          :maxlength="200"
        />
      </a-form-item>

      <!-- Reminder trigger method -->
      <a-form-item label="提醒触发方式">
        <a-radio-group v-model:value="formState.dateMode">
          <a-radio :value="DateMode.RELATIVE">相对日期（T-n / R-n）</a-radio>
          <a-radio :value="DateMode.MANUAL">手动选择日期</a-radio>
        </a-radio-group>
      </a-form-item>

      <template v-if="formState.dateMode === DateMode.RELATIVE">
        <a-form-item label="基准类型">
          <a-radio-group v-model:value="formState.refType">
            <a-radio-button :value="RefType.T">T-n</a-radio-button>
            <a-radio-button :value="RefType.R">R-n</a-radio-button>
          </a-radio-group>
          <div style="color: #8c8c8c; font-size: 12px; margin-top: 4px">
            T/R 均基于所选日程事件的日期，n 表示提前 n 天
          </div>
        </a-form-item>

        <a-form-item
          label="提前天数（n）"
          name="offsetDays"
          :rules="[{ required: true, type: 'number', message: '请输入提前天数', trigger: 'blur' }]"
        >
          <a-input-number
            v-model:value="formState.offsetDays"
            :min="0"
            :max="3650"
            style="width: 100%"
            placeholder="如 7 表示提前7天"
          >
            <template #addonAfter>天</template>
          </a-input-number>
        </a-form-item>
      </template>

      <template v-if="formState.dateMode === DateMode.MANUAL">
        <a-form-item
          label="提醒日期"
          name="manualDate"
          :rules="[{ required: true, message: '请选择提醒日期', type: 'object', trigger: 'change' }]"
        >
          <a-date-picker
            v-model:value="formState.manualDate"
            style="width: 100%"
            placeholder="请选择提醒日期"
            format="YYYY-MM-DD"
          />
        </a-form-item>
      </template>

      <!-- Preview -->
      <a-alert type="info" showIcon style="margin-top: 8px">
        <template #message>
          <span v-if="!selectedScheduleEvent && formState.dateMode !== DateMode.MANUAL">
            请先选择产品和日程事件
          </span>
          <span v-else>
            提醒触发日期预览：<strong>{{ triggerDatePreview }}</strong>
          </span>
        </template>
      </a-alert>
    </a-form>
  </a-modal>
</template>