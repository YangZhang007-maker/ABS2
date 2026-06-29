<script setup lang="ts">
import { reactive, ref } from 'vue';
import { message } from 'ant-design-vue';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/api/auth.api';

const authStore = useAuthStore();
const formRef = ref();
const submitting = ref(false);

const formState = reactive({
  name: authStore.user?.name || '',
  email: authStore.user?.email || '',
  password: '',
  confirmPassword: '',
});

const userInfo = authStore.user;

async function handleSubmit() {
  try {
    await formRef.value?.validateFields();

    if (formState.password && formState.password !== formState.confirmPassword) {
      message.warning('两次输入的密码不一致');
      return;
    }

    submitting.value = true;
    const payload: any = { name: formState.name };

    if (formState.email) {
      payload.email = formState.email;
    }

    if (formState.password) {
      payload.password = formState.password;
    }

    const updated = await authApi.updateProfile(payload);
    authStore.user = updated;
    formState.password = '';
    formState.confirmPassword = '';
    message.success('个人信息已更新');
  } catch (e: any) {
    if (e?.errorFields?.length > 0) {
      message.warning(e.errorFields[0].errors?.[0] || '请检查表单填写');
      return;
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="profile-container">
    <h2>个人信息</h2>
    <div style="max-width: 480px; margin: 24px auto 0">
      <a-form
        ref="formRef"
        :model="formState"
        layout="vertical"
      >
        <a-form-item label="用户名">
          <a-input :value="userInfo?.username" disabled />
        </a-form-item>

        <a-form-item label="角色">
          <a-input :value="userInfo?.role" disabled />
        </a-form-item>

        <a-form-item
          label="姓名"
          name="name"
          :rules="[{ required: true, message: '请输入姓名', trigger: 'blur' }]"
        >
          <a-input v-model:value="formState.name" placeholder="请输入姓名" :maxlength="100" />
        </a-form-item>

        <a-form-item label="邮箱" name="email">
          <a-input v-model:value="formState.email" placeholder="请输入邮箱地址，用于接收日程提醒" :maxlength="200" />
          <div style="color: #8c8c8c; font-size: 12px; margin-top: 4px">
            系统将在日程事件和提醒事件当天发送提醒邮件到该邮箱
          </div>
        </a-form-item>

        <a-divider>修改密码（留空则不修改）</a-divider>

        <a-form-item label="新密码" name="password">
          <a-input-password v-model:value="formState.password" placeholder="输入新密码" :maxlength="200" />
        </a-form-item>

        <a-form-item label="确认密码" name="confirmPassword">
          <a-input-password v-model:value="formState.confirmPassword" placeholder="再次输入新密码" :maxlength="200" />
        </a-form-item>

        <a-form-item>
          <a-button type="primary" :loading="submitting" block @click="handleSubmit">
            保存修改
          </a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
}
.profile-container h2 {
  margin-bottom: 0;
}
</style>