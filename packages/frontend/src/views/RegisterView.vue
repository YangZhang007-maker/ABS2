<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { UserOutlined, LockOutlined, IdcardOutlined, MailOutlined } from '@ant-design/icons-vue';
import { message } from 'ant-design-vue';
import { authApi } from '@/api/auth.api';

const router = useRouter();
const loading = ref(false);
const submitDisabled = ref(false);

const formState = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: '',
});

async function handleRegister() {
  if (!formState.username || !formState.password || !formState.name) {
    message.warning('请填写必填信息');
    return;
  }

  if (formState.password !== formState.confirmPassword) {
    message.warning('两次输入的密码不一致');
    return;
  }

  if (formState.password.length < 6) {
    message.warning('密码长度不能少于6位');
    return;
  }

  loading.value = true;
  try {
    const data: any = {
      username: formState.username,
      password: formState.password,
      name: formState.name,
    };
    if (formState.email) {
      data.email = formState.email;
    }
    await authApi.register(data);
    message.success('注册成功，请登录');
    router.push('/login');
  } catch (e: any) {
    // Error handled by axios interceptor
  } finally {
    loading.value = false;
  }
}

function goToLogin() {
  router.push('/login');
}
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>ABS 存续期智能提醒系统</h1>
        <p class="register-subtitle">创建新账户</p>
      </div>

      <a-form :model="formState" layout="vertical" @submit.prevent="handleRegister">
        <a-form-item label="用户名" required>
          <a-input
            v-model:value="formState.username"
            placeholder="请输入用户名"
            size="large"
          >
            <template #prefix><UserOutlined /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="姓名" required>
          <a-input
            v-model:value="formState.name"
            placeholder="请输入姓名"
            size="large"
          >
            <template #prefix><IdcardOutlined /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="邮箱">
          <a-input
            v-model:value="formState.email"
            placeholder="请输入邮箱（选填）"
            size="large"
          >
            <template #prefix><MailOutlined /></template>
          </a-input>
        </a-form-item>

        <a-form-item label="密码" required>
          <a-input-password
            v-model:value="formState.password"
            placeholder="请输入密码（至少6位）"
            size="large"
          >
            <template #prefix><LockOutlined /></template>
          </a-input-password>
        </a-form-item>

        <a-form-item label="确认密码" required>
          <a-input-password
            v-model:value="formState.confirmPassword"
            placeholder="请再次输入密码"
            size="large"
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
            注 册
          </a-button>
        </a-form-item>
      </a-form>

      <div class="register-footer">
        <span>已有账户？</span>
        <a-button type="link" @click="goToLogin" style="padding: 0 4px">
          去登录
        </a-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-card {
  width: 420px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: #1890ff;
  margin: 0 0 8px;
}

.register-subtitle {
  color: #8c8c8c;
  font-size: 14px;
  margin: 0;
}

.register-footer {
  text-align: center;
  font-size: 14px;
  color: #8c8c8c;
}
</style>