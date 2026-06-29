<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import { useUiStore } from '@/stores/ui.store';
import { useProductStore } from '@/stores/product.store';
import { useScheduleStore } from '@/stores/schedule.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { EVENT_TYPE_LABELS, EVENT_TYPE_KNOWN_VALUES } from '@/utils/constants';
import { scheduleEventApi } from '@/api/schedule-event.api';

const uiStore = useUiStore();
const productStore = useProductStore();
const scheduleStore = useScheduleStore();
const dashboardStore = useDashboardStore();

const formRef = ref();
const submitting = ref(false);

const EVENT_TYPE_PRESETS = [
  { value: '设立日' },
  { value: '兑付日' },
  { value: '计算日' },
];

const formState = reactive({
  productId: '' as string,
  eventType: '' as string,
  remark: '',
  eventDate: null as Dayjs | null,
});

const isEdit = computed(() => !!uiStore.editingScheduleId);
const title = computed(() => (isEdit.value ? '编辑日程事件' : '创建日程事件'));

// For editing: display-only product name and event type
const displayProductName = ref('');
const displayEventTypeLabel = ref('');

function getEventTypeLabel(type: string): string {
  return EVENT_TYPE_LABELS[type] || type;
}

const eventTypeOptions = computed(() => {
  if (isEdit.value) return []; // not used in edit mode
  if (!formState.eventType) return EVENT_TYPE_PRESETS;
  const filtered = EVENT_TYPE_PRESETS.filter((o) =>
    o.value.includes(formState.eventType),
  );
  if (formState.eventType && !filtered.some((o) => o.value === formState.eventType)) {
    return [{ value: formState.eventType }, ...filtered];
  }
  return filtered;
});

watch(
  () => uiStore.scheduleFormVisible,
  async (visible) => {
    if (visible) {
      formRef.value?.resetFields();
      displayProductName.value = '';
      displayEventTypeLabel.value = '';

      if (uiStore.editingScheduleId) {
        // Look up event data from multiple sources: scheduleStore, dashboardStore, or direct API
        const editingId = uiStore.editingScheduleId;

        // Try scheduleStore first
        let existingEvent = scheduleStore.scheduleEvents.find((e) => e.id === editingId);

        // Fallback: try dashboardStore.scheduleItems
        if (!existingEvent) {
          const item = dashboardStore.scheduleItems.find((i) => i.id === editingId);
          if (item) {
            existingEvent = {
              id: item.id,
              productId: item.productId,
              eventType: item.eventType,
              scheduleName: item.eventName,
              remark: '',
              eventDate: item.date,
              completed: item.completed,
            } as any;
          }
        }

        if (existingEvent) {
          formState.productId = existingEvent.productId;
          formState.eventType = existingEvent.eventType;
          formState.remark = (existingEvent as any).remark || '';
          formState.eventDate = existingEvent.eventDate ? dayjs(existingEvent.eventDate) : null;

          // Display-only values
          const product = productStore.products.find((p) => p.id === existingEvent!.productId);
          displayProductName.value = product?.name || existingEvent!.productId;
          displayEventTypeLabel.value = getEventTypeLabel(existingEvent!.eventType);
        } else {
          // Last resort: fetch from API
          try {
            const event = await scheduleEventApi.get(editingId);
            if (event) {
              formState.productId = event.productId;
              formState.eventType = event.eventType;
              formState.remark = event.remark || '';
              formState.eventDate = event.eventDate ? dayjs(event.eventDate) : null;

              const product = productStore.products.find((p) => p.id === event.productId);
              displayProductName.value = product?.name || event.productId;
              displayEventTypeLabel.value = getEventTypeLabel(event.eventType);
            }
          } catch (e) {
            console.error('获取日程事件失败:', e);
          }
        }
      } else {
        const defaultProductId =
          uiStore.scheduleFormProductId ||
          productStore.selectedProductId ||
          (productStore.products.length > 0 ? productStore.products[0].id : '');

        formState.productId = defaultProductId;
        formState.eventType = '';
        formState.remark = '';
        formState.eventDate = null;
      }
    }
  },
);

async function handleSubmit() {
  try {
    // Only validate date (and type for create mode)
    if (!isEdit.value) {
      await formRef.value?.validateFields();
    }

    if (!formState.eventDate) {
      message.warning('请选择日程日期');
      return;
    }

    if (!isEdit.value) {
      const type = formState.eventType.trim();
      if (!type) {
        message.warning('请输入事件类型');
        return;
      }
    }

    submitting.value = true;

    if (isEdit.value) {
      // Edit mode: only send eventDate (remark and eventType are readonly)
      await scheduleEventApi.update(uiStore.editingScheduleId!, {
        eventDate: formState.eventDate.toISOString(),
      });
      message.success('日程事件已更新');
    } else {
      // Create mode: send everything
      let eventType = formState.eventType.trim();
      const labelToValue: Record<string, string> = {
        '设立日': 'establishment',
        '兑付日': 'payment',
        '计算日': 'calculation',
      };
      if (labelToValue[eventType]) {
        eventType = labelToValue[eventType];
      }

      await scheduleEventApi.create(formState.productId, {
        eventType,
        remark: formState.remark || undefined,
        eventDate: formState.eventDate.toISOString(),
      });
      message.success('日程事件已创建');
    }

    uiStore.closeScheduleForm();
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
  uiStore.closeScheduleForm();
}

const scheduleNamePreview = computed(() => {
  if (!formState.productId || !formState.eventType) return '';
  const product = productStore.products.find((p) => p.id === formState.productId);
  const typeLabel = getEventTypeLabel(formState.eventType);
  let name = `${product?.name || '产品'}-${typeLabel}`;
  if (formState.remark) name += `-${formState.remark}`;
  return name;
});

const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().startOf('day');
};
</script>

<template>
  <a-modal
    :open="uiStore.scheduleFormVisible"
    :title="title"
    :confirmLoading="submitting"
    @ok="handleSubmit"
    @cancel="handleCancel"
    :maskClosable="false"
    width="520px"
    :destroyOnClose="true"
  >
    <a-form
      ref="formRef"
      :model="formState"
      layout="vertical"
      style="margin-top: 16px"
    >
      <!-- Product: dropdown for create, readonly text for edit -->
      <a-form-item v-if="!isEdit"
        label="所属产品"
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
      <a-form-item v-else label="所属产品">
        <a-input :value="displayProductName" disabled />
      </a-form-item>

      <!-- Event type: autocomplete for create, readonly text for edit -->
      <a-form-item v-if="!isEdit" label="事件类型" required>
        <a-auto-complete
          v-model:value="formState.eventType"
          :options="eventTypeOptions"
          placeholder="选择或输入事件类型，如：设立日、兑付日、计算日"
          style="width: 100%"
          :filter-option="false"
        />
      </a-form-item>
      <a-form-item v-else label="事件类型">
        <a-input :value="displayEventTypeLabel" disabled />
      </a-form-item>

      <!-- Remark: editable in create, readonly in edit -->
      <a-form-item v-if="!isEdit" label="备注（选填）" name="remark">
        <a-input
          v-model:value="formState.remark"
          placeholder="可选备注信息，如：第1期"
          :maxlength="200"
        />
      </a-form-item>
      <a-form-item v-else label="备注">
        <a-input :value="formState.remark || '-'" disabled />
      </a-form-item>

      <!-- Date: always editable -->
      <a-form-item
        label="日程日期"
        name="eventDate"
        :rules="isEdit ? [] : [{ required: true, message: '请选择日程日期', type: 'object' }]"
      >
        <a-date-picker
          v-model:value="formState.eventDate"
          style="width: 100%"
          placeholder="请选择日期"
          format="YYYY-MM-DD"
          :disabledDate="disabledDate"
        />
      </a-form-item>

      <a-alert v-if="!isEdit" type="info" showIcon style="margin-top: 8px">
        <template #message>
          日程名称将自动生成：<strong>{{ scheduleNamePreview || '请在输入事件类型后预览' }}</strong>
        </template>
      </a-alert>
    </a-form>
  </a-modal>
</template>