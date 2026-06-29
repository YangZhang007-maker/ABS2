<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue';
import AppHeader from '@/components/layout/AppHeader.vue';
import ProductFormModal from '@/components/product/ProductFormModal.vue';
import ScheduleEventFormModal from '@/components/schedule/ScheduleEventFormModal.vue';
import ReminderEventFormModal from '@/components/reminder/ReminderEventFormModal.vue';
</script>

<template>
  <a-layout style="min-height: 100vh">
    <AppSidebar />
    <a-layout>
      <AppHeader />
      <a-layout-content style="margin: 24px; background: #fff; padding: 24px; border-radius: 8px; min-height: 360px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
  <ProductFormModal />
  <ScheduleEventFormModal />
  <ReminderEventFormModal />
</template>