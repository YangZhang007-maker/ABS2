<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { UserOutlined, LockOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { useAuthStore } from '@/stores/auth.store';

const router = useRouter();
const authStore = useAuthStore();
const loading = ref(false);

const formState = reactive({
  username: '',
  password: '',
});

function goToRegister() {
  router.push('/register');
}

async function handleLogin() {
  if (!formState.username || !formState.password) {
    message.warning('请输入用户名和密码');
    return;
  }

  loading.value = true;
  try {
    await authStore.login(formState);
    message.success(`欢迎回来，${authStore.user?.name}`);
    if (authStore.isSales) {
      router.push('/products');
    } else {
      router.push('/');
    }
  } catch (e: any) {
    // Error already handled by axios interceptor
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>ABS 存续期智能提醒系统</h1>
        <p class="login-subtitle">请登录以继续</p>
      </div>

      <a-form :model="formState" layout="vertical" @submit.prevent="handleLogin">
        <a-form-item label="用户名">
          <a-input
            v-model:value="formState.username"
            placeholder="请输入用户名"
            size="large"
            @pressEnter="handleLogin"
          >
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码">
          <a-input-password
            v-model:value="formState.password"
            placeholder="请输入密码"
            size="large"
            @pressEnter="handleLogin"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item>
          <a-button
            type="primary"
            block
            size="large"
            :loading="loading"
            html-type="submit"
          >
            登 录
          </a-button>
        </a-form-item>
      </a-form>

      <div class="login-footer">
        <span>还没有账户？</span>
        <a-button type="link" @click="goToRegister" style="padding: 0 4px">
          立即注册
        </a-button>
      </div>

      <div class="login-hint">
        <p>测试账号（初始密码均为 admin123）：</p>
        <p>root — 部门总负责人 | owner1 — 产品负责人 | sales1 — 销售人员</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1890ff;
  margin: 0 0 8px;
}

.login-subtitle {
  color: #8c8c8c;
  font-size: 14px;
  margin: 0;
}

.login-hint {
  margin-top: 24px;
  padding: 12px;
  background: #f6f8fa;
  border-radius: 6px;
  font-size: 12px;
  color: #8c8c8c;
  text-align: center;
  line-height: 1.8;
}

.login-hint p {
  margin: 0;
}
</style>