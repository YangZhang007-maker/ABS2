import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false);
  const productFormVisible = ref(false);
  const editingProductId = ref<string | null>(null);
  const scheduleFormVisible = ref(false);
  const editingScheduleId = ref<string | null>(null);
  const scheduleFormProductId = ref<string | null>(null);
  const reminderFormVisible = ref(false);
  const editingReminderId = ref<string | null>(null);
  const reminderFormScheduleEventId = ref<string | null>(null);

  function openProductForm(productId?: string) {
    editingProductId.value = productId || null;
    productFormVisible.value = true;
  }

  function closeProductForm() {
    productFormVisible.value = false;
    editingProductId.value = null;
  }

  function openScheduleForm(productId?: string, scheduleId?: string) {
    scheduleFormProductId.value = productId || null;
    editingScheduleId.value = scheduleId || null;
    scheduleFormVisible.value = true;
  }

  function closeScheduleForm() {
    scheduleFormVisible.value = false;
    editingScheduleId.value = null;
    scheduleFormProductId.value = null;
  }

  function openReminderForm(scheduleEventId?: string, reminderId?: string) {
    reminderFormScheduleEventId.value = scheduleEventId || null;
    editingReminderId.value = reminderId || null;
    reminderFormVisible.value = true;
  }

  function closeReminderForm() {
    reminderFormVisible.value = false;
    editingReminderId.value = null;
    reminderFormScheduleEventId.value = null;
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  return {
    sidebarCollapsed,
    productFormVisible,
    editingProductId,
    scheduleFormVisible,
    editingScheduleId,
    scheduleFormProductId,
    reminderFormVisible,
    editingReminderId,
    reminderFormScheduleEventId,
    openProductForm,
    closeProductForm,
    openScheduleForm,
    closeScheduleForm,
    openReminderForm,
    closeReminderForm,
    toggleSidebar,
  };
});