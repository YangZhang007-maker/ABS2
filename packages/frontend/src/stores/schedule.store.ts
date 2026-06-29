import { defineStore } from 'pinia';
import { ref } from 'vue';
import { scheduleEventApi } from '@/api/schedule-event.api';
import type { ScheduleEvent, CreateScheduleEventData, UpdateScheduleEventData } from '@/types/schedule';

export const useScheduleStore = defineStore('schedule', () => {
  const scheduleEvents = ref<ScheduleEvent[]>([]);
  const loading = ref(false);

  async function fetchByProduct(productId: string) {
    loading.value = true;
    try {
      scheduleEvents.value = await scheduleEventApi.listByProduct(productId);
    } finally {
      loading.value = false;
    }
  }

  async function create(productId: string, data: CreateScheduleEventData) {
    const event = await scheduleEventApi.create(productId, data);
    scheduleEvents.value.push(event);
    return event;
  }

  async function update(id: string, data: UpdateScheduleEventData) {
    const event = await scheduleEventApi.update(id, data);
    const idx = scheduleEvents.value.findIndex((e) => e.id === id);
    if (idx !== -1) {
      scheduleEvents.value[idx] = event;
    }
    return event;
  }

  async function remove(id: string) {
    await scheduleEventApi.remove(id);
    scheduleEvents.value = scheduleEvents.value.filter((e) => e.id !== id);
  }

  return {
    scheduleEvents,
    loading,
    fetchByProduct,
    create,
    update,
    remove,
  };
});