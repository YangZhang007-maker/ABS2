<script setup lang="ts">
import { reactive, ref, watch, computed } from 'vue';
import dayjs, { type Dayjs } from 'dayjs';
import { message } from 'ant-design-vue';
import { useUiStore } from '@/stores/ui.store';
import { useProductStore } from '@/stores/product.store';
import { useDashboardStore } from '@/stores/dashboard.store';
import { useAuthStore } from '@/stores/auth.store';
import { EventType } from '@/types/schedule';
import { scheduleEventApi } from '@/api/schedule-event.api';

const uiStore = useUiStore();
const productStore = useProductStore();
const dashboardStore = useDashboardStore();
const authStore = useAuthStore();

const step = ref(0);
const submitting = ref(false);

// Step 1 — product info
const form1Ref = ref();
const formState1 = reactive({
  name: '',
  creator: '',
});

// Step 2 — establishment date
const form2Ref = ref();
const formState2 = reactive({
  remark: '',
  eventDate: null as Dayjs | null,
});

// Step 3 — payment date
const form3Ref = ref();
const formState3 = reactive({
  remark: '',
  eventDate: null as Dayjs | null,
});

const title = computed(() => {
  if (step.value === 0) return '创建产品 — 基本信息';
  if (step.value === 1) return '创建产品 — 设立日';
  return '创建产品 — 兑付日';
});

const disabledDate = (current: Dayjs) => {
  return current && current < dayjs().startOf('day');
};

watch(
  () => uiStore.productFormVisible,
  (visible) => {
    if (visible) {
      step.value = 0;
      formState1.name = '';
      formState1.creator = authStore.user?.name || '';
      formState2.remark = '';
      formState2.eventDate = null;
      formState3.remark = '';
      formState3.eventDate = null;
    }
  },
);

async function validateStep(): Promise<boolean> {
  try {
    if (step.value === 0) {
      if (!formState1.name.trim()) {
        message.warning('请输入产品名称');
        return false;
      }
      return true;
    }
    if (step.value === 1) {
      if (!formState2.eventDate) {
        message.warning('请选择设立日期');
        return false;
      }
      return true;
    }
    if (step.value === 2) {
      if (!formState3.eventDate) {
        message.warning('请选择兑付日期');
        return false;
      }
      return true;
    }
    return true;
  } catch {
    return false;
  }
}

async function handleNext() {
  const valid = await validateStep();
  if (!valid) return;
  step.value++;
}

async function handleSubmit() {
  const valid = await validateStep();
  if (!valid) return;

  submitting.value = true;
  try {
    // 1. Create product
    const product = await productStore.createProduct({
      name: formState1.name.trim(),
      creator: formState1.creator,
    });
    const productId = product.id;

    // 2. Create establishment schedule event
    await scheduleEventApi.create(productId, {
      eventType: EventType.ESTABLISHMENT,
      remark: formState2.remark || undefined,
      eventDate: formState2.eventDate!.toISOString(),
    });

    // 3. Create payment schedule event
    await scheduleEventApi.create(productId, {
      eventType: EventType.PAYMENT,
      remark: formState3.remark || undefined,
      eventDate: formState3.eventDate!.toISOString(),
    });

    message.success('产品、设立日、兑付日已全部创建');
    uiStore.closeProductForm();
    dashboardStore.fetchSchedule(productStore.selectedProductId || undefined);
  } catch (e: any) {
    console.error('创建失败:', e);
  } finally {
    submitting.value = false;
  }
}

function handleCancel() {
  uiStore.closeProductForm();
}
</script>

<template>
  <a-modal
    :open="uiStore.productFormVisible"
    :title="title"
    :confirmLoading="submitting"
    @cancel="handleCancel"
    :maskClosable="false"
    :destroyOnClose="true"
    width="520px"
    :footer="null"
  >
    <!-- Step indicators -->
    <a-steps :current="step" size="small" style="margin-bottom: 24px">
      <a-step title="基本信息" />
      <a-step title="设立日" />
      <a-step title="兑付日" />
    </a-steps>

    <!-- Step 1: Product Info -->
    <div v-show="step === 0">
      <a-form ref="form1Ref" :model="formState1" layout="vertical">
        <a-form-item label="产品名称" required>
          <a-input
            v-model:value="formState1.name"
            placeholder="请输入产品名称"
            :maxlength="200"
          />
        </a-form-item>
        <a-form-item label="创建人">
          <a-input
            v-model:value="formState1.creator"
            disabled
          />
        </a-form-item>
      </a-form>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px">
        <a-button @click="handleCancel">取消</a-button>
        <a-button type="primary" @click="handleNext">下一步</a-button>
      </div>
    </div>

    <!-- Step 2: Establishment Date -->
    <div v-show="step === 1">
      <a-form ref="form2Ref" :model="formState2" layout="vertical">
        <a-form-item label="事件类型">
          <a-tag color="blue">设立日</a-tag>
        </a-form-item>
        <a-form-item label="备注（选填）">
          <a-input
            v-model:value="formState2.remark"
            placeholder="可选备注"
            :maxlength="200"
          />
        </a-form-item>
        <a-form-item label="设立日期" required>
          <a-date-picker
            v-model:value="formState2.eventDate"
            style="width: 100%"
            placeholder="请选择设立日期"
            format="YYYY-MM-DD"
            :disabledDate="disabledDate"
          />
        </a-form-item>
      </a-form>
      <a-alert type="info" showIcon style="margin-bottom: 16px">
        <template #message>
          日程名称预览：<strong>{{ formState1.name || '产品' }}-设立日{{ formState2.remark ? '-' + formState2.remark : '' }}</strong>
        </template>
      </a-alert>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px">
        <a-button @click="step = 0">上一步</a-button>
        <a-button type="primary" @click="handleNext">下一步</a-button>
      </div>
    </div>

    <!-- Step 3: Payment Date -->
    <div v-show="step === 2">
      <a-form ref="form3Ref" :model="formState3" layout="vertical">
        <a-form-item label="事件类型">
          <a-tag color="orange">兑付日</a-tag>
        </a-form-item>
        <a-form-item label="备注（选填）">
          <a-input
            v-model:value="formState3.remark"
            placeholder="可选备注"
            :maxlength="200"
          />
        </a-form-item>
        <a-form-item label="兑付日期" required>
          <a-date-picker
            v-model:value="formState3.eventDate"
            style="width: 100%"
            placeholder="请选择兑付日期"
            format="YYYY-MM-DD"
            :disabledDate="disabledDate"
          />
        </a-form-item>
      </a-form>
      <a-alert type="info" showIcon style="margin-bottom: 16px">
        <template #message>
          日程名称预览：<strong>{{ formState1.name || '产品' }}-兑付日{{ formState3.remark ? '-' + formState3.remark : '' }}</strong>
        </template>
      </a-alert>
      <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px">
        <a-button @click="step = 1">上一步</a-button>
        <a-button type="primary" :loading="submitting" @click="handleSubmit">完成创建</a-button>
      </div>
    </div>
  </a-modal>
</template>