import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleEvent } from '../schedule-event/entities/schedule-event.entity';
import { ReminderEvent } from '../reminder-event/entities/reminder-event.entity';
import { ProductService } from '../product/product.service';
import { UserRole } from '../../common/enums/user-role.enum';

export interface ScheduleItem {
  id: string;
  type: 'schedule_event' | 'reminder_event';
  productId: string;
  productName: string;
  eventType: string;
  eventName: string;
  relatedEventName?: string;
  date: Date;
  isReminder: boolean;
  scheduleEventId?: string;
  completed: boolean;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(ScheduleEvent)
    private readonly scheduleEventRepository: Repository<ScheduleEvent>,
    @InjectRepository(ReminderEvent)
    private readonly reminderEventRepository: Repository<ReminderEvent>,
    private readonly productService: ProductService,
  ) {}

  async getSchedule(
    productId: string | undefined,
    userId: string,
    role: UserRole,
    showCompleted: boolean,
    search?: string,
    page?: number,
    limit?: number,
  ): Promise<{ items: ScheduleItem[]; total: number; page: number; limit: number }> {
    const pageNum = page || 1;
    const pageSize = limit || 10;

    if (productId) {
      await this.productService.findOne(productId, userId, role);
    }

    const accessibleIds = await this.productService.getAccessibleProductIds(userId, role);
    if (accessibleIds.length === 0) {
      return { items: [], total: 0, page: pageNum, limit: pageSize };
    }

    const queryIds = productId
      ? accessibleIds.filter((id) => id === productId)
      : accessibleIds;

    if (queryIds.length === 0) {
      return { items: [], total: 0, page: pageNum, limit: pageSize };
    }

    const items: ScheduleItem[] = [];

    // Query schedule events
    const scheduleQb = this.scheduleEventRepository
      .createQueryBuilder('se')
      .leftJoinAndSelect('se.product', 'product')
      .where('se.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('product.is_deleted = :pDeleted', { pDeleted: false })
      .andWhere('se.product_id IN (:...ids)', { ids: queryIds })
      .andWhere('se.completed = :completed', { completed: showCompleted });

    // Non-admin users cannot see admin-only events (中基协备案, 转付至托管户)
    if (role !== UserRole.ROOT && role !== UserRole.ROOT2) {
      scheduleQb.andWhere('se.visibility != :adminVis', { adminVis: 'admin' });
    }

    // Search by product name
    if (search && search.trim()) {
      scheduleQb.andWhere('product.name ILIKE :search', { search: `%${search.trim()}%` });
    }

    const scheduleEvents = await scheduleQb.getMany();

    // Query reminder events
    const reminderQb = this.reminderEventRepository
      .createQueryBuilder('re')
      .leftJoinAndSelect('re.scheduleEvent', 'se')
      .leftJoinAndSelect('se.product', 'product')
      .where('re.is_deleted = :isDeleted', { isDeleted: false })
      .andWhere('se.is_deleted = :seDeleted', { seDeleted: false })
      .andWhere('product.is_deleted = :pDeleted', { pDeleted: false })
      .andWhere('se.product_id IN (:...ids)', { ids: queryIds })
      .andWhere('re.completed = :completed', { completed: showCompleted });

    // Search by product name
    if (search && search.trim()) {
      reminderQb.andWhere('product.name ILIKE :search', { search: `%${search.trim()}%` });
    }

    const reminderEvents = await reminderQb.getMany();

    for (const se of scheduleEvents) {
      items.push({
        id: se.id,
        type: 'schedule_event',
        productId: se.productId,
        productName: se.product?.name || '',
        eventType: se.eventType,
        eventName: se.scheduleName,
        date: se.eventDate,
        isReminder: false,
        completed: se.completed,
      });
    }

    for (const re of reminderEvents) {
      items.push({
        id: re.id,
        type: 'reminder_event',
        productId: re.scheduleEvent?.productId || '',
        productName: re.scheduleEvent?.product?.name || '',
        eventType: 'reminder',
        eventName: re.reminderName,
        relatedEventName: re.scheduleEvent?.scheduleName,
        date: re.triggerDate,
        isReminder: true,
        scheduleEventId: re.scheduleEventId,
        completed: re.completed,
      });
    }

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const total = items.length;
    const start = (pageNum - 1) * pageSize;
    const paginated = items.slice(start, start + pageSize);

    return { items: paginated, total, page: pageNum, limit: pageSize };
  }
}