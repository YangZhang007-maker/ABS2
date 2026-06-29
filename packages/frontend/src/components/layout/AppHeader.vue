<script setup lang="ts">
import { useRouter } from 'vue-router';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons-vue';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <a-layout-header class="app-header">
    <div class="header-left">
      <a-breadcrumb>
        <a-breadcrumb-item>
          <a @click="router.push('/')">首页</a>
        </a-breadcrumb-item>
        <a-breadcrumb-item v-if="router.currentRoute.value.name === 'products'">
          产品管理
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>
    <div class="header-right">
      <a-space>
        <span class="user-info" style="cursor: pointer" @click="router.push('/profile')">
          <UserOutlined />
          {{ authStore.user?.name }}
          <a-tag :color="authStore.isRoot ? 'red' : authStore.isProductOwner ? 'blue' : 'green'" style="margin-left: 4px">
            {{ authStore.isRoot ? '总负责人' : authStore.isProductOwner ? '产品负责人' : '销售人员' }}
          </a-tag>
        </span>
        <a-button type="text" @click="handleLogout">
          <LogoutOutlined /> 退出
        </a-button>
      </a-space>
    </div>
  </a-layout-header>
</template>

<style scoped>
.app-header {
  background: #fff;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #f0f0f0;
  height: 64px;
  line-height: 64px;
}
.header-left {
  display: flex;
  align-items: center;
}
.header-right {
  display: flex;
  align-items: center;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #333;
  font-size: 14px;
}
</style>