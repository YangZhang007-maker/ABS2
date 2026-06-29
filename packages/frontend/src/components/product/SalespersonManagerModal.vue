<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { message } from 'ant-design-vue';
import { UserAddOutlined, UserDeleteOutlined } from '@ant-design/icons-vue';
import { productApi } from '@/api/product.api';
import { userApi } from '@/api/user.api';
import type { UserInfo } from '@/types/auth';

const props = defineProps<{
  open: boolean;
  productId: string;
  productName: string;
}>();

const emit = defineEmits<{
  'update:open': [value: boolean];
}>();

const salesUsers = ref<UserInfo[]>([]);
const currentSalespersons = ref<UserInfo[]>([]);
const loading = ref(false);
const saving = ref(false);

async function loadData() {
  if (!props.productId) return;
  loading.value = true;
  try {
    const [users, salespersons] = await Promise.all([
      userApi.listByRole('sales'),
      productApi.getSalespersons(props.productId),
    ]);
    salesUsers.value = users;
    currentSalespersons.value = salespersons;
  } catch (e) {
    console.error('加载数据失败:', e);
  } finally {
    loading.value = false;
  }
}

watch(() => props.open, (visible) => {
  if (visible) loadData();
});

function isAssigned(user: UserInfo) {
  return currentSalespersons.value.some((s) => s.id === user.id);
}

async function handleAdd(user: UserInfo) {
  saving.value = true;
  try {
    const ids = [...currentSalespersons.value.map((s) => s.id), user.id];
    await productApi.updateSalespersons(props.productId, { salespersonIds: ids });
    currentSalespersons.value.push(user);
    message.success(`已添加销售人员「${user.name}」`);
  } catch (e) {
    console.error('添加失败:', e);
  } finally {
    saving.value = false;
  }
}

async function handleRemove(user: UserInfo) {
  saving.value = true;
  try {
    const ids = currentSalespersons.value.filter((s) => s.id !== user.id).map((s) => s.id);
    await productApi.updateSalespersons(props.productId, { salespersonIds: ids });
    currentSalespersons.value = currentSalespersons.value.filter((s) => s.id !== user.id);
    message.success(`已移除销售人员「${user.name}」`);
  } catch (e) {
    console.error('移除失败:', e);
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  emit('update:open', false);
}
</script>

<template>
  <a-modal
    :open="open"
    title="销售人员管理"
    @cancel="handleClose"
    :footer="null"
    width="650px"
    :destroyOnClose="true"
  >
    <div style="margin-bottom: 16px">
      <span style="color: #8c8c8c">当前产品：</span>
      <strong>{{ productName }}</strong>
    </div>

    <a-spin :spinning="loading">
      <!-- Currently assigned salespersons -->
      <div style="margin-bottom: 24px">
        <h4>已添加的销售人员（{{ currentSalespersons.length }}）</h4>
        <div v-if="currentSalespersons.length === 0" style="color: #8c8c8c; padding: 12px 0">
          暂无销售人员，请从下方候选列表中添加
        </div>
        <a-space v-else wrap>
          <a-tag
            v-for="user in currentSalespersons"
            :key="user.id"
            color="blue"
            closable
            @close="handleRemove(user)"
          >
            {{ user.name }} ({{ user.username }})
          </a-tag>
        </a-space>
      </div>

      <a-divider />

      <!-- Available sales users -->
      <div>
        <h4>候选销售人员</h4>
        <div v-if="salesUsers.filter(u => !isAssigned(u)).length === 0" style="color: #8c8c8c; padding: 12px 0">
          所有销售人员已添加
        </div>
        <a-space v-else wrap>
          <a-tag
            v-for="user in salesUsers.filter(u => !isAssigned(u))"
            :key="user.id"
            @click="handleAdd(user)"
            style="cursor: pointer"
          >
            <UserAddOutlined /> {{ user.name }} ({{ user.username }})
          </a-tag>
        </a-space>
      </div>
    </a-spin>
  </a-modal>
</template>