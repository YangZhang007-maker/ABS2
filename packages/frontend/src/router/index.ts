import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth.store';
import { authApi } from '@/api/auth.api';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: () => import('@/views/DefaultLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
        { path: 'products', name: 'products', component: () => import('@/views/ProductManageView.vue') },
        { path: 'products/sales/:id', name: 'product-detail-sales', component: () => import('@/views/ProductDetailSalesView.vue') },
        { path: 'products/:id', name: 'product-detail', component: () => import('@/views/ProductDetailView.vue') },
        { path: 'documents', name: 'document-search', component: () => import('@/views/DocumentSearchView.vue') },
        { path: 'profile', name: 'profile', component: () => import('@/views/ProfileView.vue') },
      ],
    },
  ],
});

router.beforeEach(async (to, _from, next) => {
  if (to.meta.public) {
    next();
    return;
  }

  const authStore = useAuthStore();

  if (!authStore.isLoggedIn) {
    next('/login');
    return;
  }

  if (!authStore.user) {
    try {
      await authApi.getMe().then((user) => {
        authStore.user = user;
      });
    } catch {
      authStore.logout();
      next('/login');
      return;
    }
  }

  // Sales users can only access products page
  if (authStore.isSales && to.name === 'dashboard') {
    next('/products');
    return;
  }

  next();
});

export default router;