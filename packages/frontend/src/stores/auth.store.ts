import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authApi } from '@/api/auth.api';
import type { UserInfo, LoginData } from '@/types/auth';

const TOKEN_KEY = 'abs_token';

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(TOKEN_KEY) || '');
  const user = ref<UserInfo | null>(null);
  const loading = ref(false);

  const isLoggedIn = computed(() => !!token.value);
  const isRoot = computed(() => user.value?.role === 'root');
  const isRoot2 = computed(() => user.value?.role === 'root2');
  const isProductOwner = computed(() => user.value?.role === 'product_owner');
  const isSales = computed(() => user.value?.role === 'sales');

  async function login(data: LoginData) {
    loading.value = true;
    try {
      const result = await authApi.login(data);
      token.value = result.accessToken;
      user.value = result.user;
      localStorage.setItem(TOKEN_KEY, result.accessToken);
      return result;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    try {
      user.value = await authApi.getMe();
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
  }

  return {
    token,
    user,
    loading,
    isLoggedIn,
    isRoot,
    isRoot2,
    isProductOwner,
    isSales,
    login,
    fetchUser,
    logout,
  };
});