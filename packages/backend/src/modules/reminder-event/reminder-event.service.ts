import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReminderEvent } from './entities/reminder-event.entity';
import { ScheduleEvent } from '../schedule-event/entities/schedule-event.entity';
import { CreateReminderEventDto, UpdateReminderEventDto } from './dto/reminder-event.dto';
import { DateMode } from '../../common/enums/date-mode.enum';
import { ProductService } from '../product/product.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { addTradingDays } from '../../common/utils/trading-day';

@Injectable()
export class ReminderEventService {
  constructor(
    @InjectRepository(ReminderEvent)
    private readonly reminderEventRepository: Repository<ReminderEvent>,
    @InjectRepository(ScheduleEvent)
    private readonly scheduleEventRepository: Repository<ScheduleEvent>,
    private readonly productService: ProductService,
  ) {}

  async findByScheduleEvent(
    scheduleEventId: string,
    userId: string,
    role: UserRole,
  ): Promise<ReminderEvent[]> {
    const scheduleEvent = await this.scheduleEventRepository.findOne({
      where: { id: scheduleEventId, isDeleted: false },
    });
    if (!scheduleEvent) throw new NotFoundException(`日程事件 "${scheduleEventId}" 未找到`);

    await this.productService.findOne(scheduleEvent.productId, userId, role);

    return this.reminderEventRepository.find({
      where: { scheduleEventId, isDeleted: false },
      relations: { scheduleEvent: { product: true } },
      order: { triggerDate: 'ASC' },
    });
  }

  async findOne(id: string, userId: string, role: UserRole): Promise<ReminderEvent> {
    const reminder = await this.reminderEventRepository.findOne({
      where: { id, isDeleted: false },
      relations: { scheduleEvent: { product: true } },
    });
    if (!reminder) throw new NotFoundException(`提醒事件 "${id}" 未找到`);

    await this.productService.findOne(reminder.scheduleEvent.productId, userId, role);
    return reminder;
  }

  private computeTriggerDate(
    scheduleEventDate: Date,
    dto: CreateReminderEventDto | UpdateReminderEventDto,
  ): Date {
    if (dto.dateMode === DateMode.MANUAL && (dto as any).manualDate) {
      return new Date((dto as any).manualDate);
    }
    if (dto.dateMode === DateMode.RELATIVE && dto.offsetDays !== undefined) {
      // T-n: n 为交易日偏移，从基准日向前推 n 个交易日
      return addTradingDays(scheduleEventDate, -dto.offsetDays);
    }
    throw new BadRequestException('无法计算提醒触发日期，请检查输入参数');
  }

  async create(
    scheduleEventId: string,
    dto: CreateReminderEventDto,
    userId: string,
    role: UserRole,
  ): Promise<ReminderEvent> {
    const scheduleEvent = await this.scheduleEventRepository.findOne({
      where: { id: scheduleEventId, isDeleted: false },
      relations: { product: true },
    });
    if (!scheduleEvent) throw new NotFoundException(`日程事件 "${scheduleEventId}" 未找到`);

    // Only ROOT or product owner can create
    if (role !== UserRole.ROOT && scheduleEvent.product.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以创建提醒');
    }

    const triggerDate = this.computeTriggerDate(scheduleEvent.eventDate, dto);
    const reminder = this.reminderEventRepository.create({
      scheduleEventId,
      reminderName: dto.reminderName,
      dateMode: dto.dateMode,
      refType: dto.refType || null,
      offsetDays: dto.offsetDays ?? null,
      manualDate: dto.manualDate ? new Date(dto.manualDate) : null,
      triggerDate,
    });
    return this.reminderEventRepository.save(reminder);
  }

  async update(
    id: string,
    dto: UpdateReminderEventDto,
    userId: string,
    role: UserRole,
  ): Promise<ReminderEvent> {
    const reminder = await this.findOne(id, userId, role);

    if (role !== UserRole.ROOT && reminder.scheduleEvent.product?.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以编辑提醒');
    }

    if (dto.reminderName !== undefined) reminder.reminderName = dto.reminderName;
    if (dto.dateMode !== undefined) reminder.dateMode = dto.dateMode;
    if (dto.refType !== undefined) reminder.refType = dto.refType;
    if (dto.offsetDays !== undefined) reminder.offsetDays = dto.offsetDays;
    if (dto.manualDate !== undefined) reminder.manualDate = dto.manualDate ? new Date(dto.manualDate) : null;

    const scheduleEvent = await this.scheduleEventRepository.findOne({
      where: { id: reminder.scheduleEventId, isDeleted: false },
    });
    if (scheduleEvent) {
      reminder.triggerDate = this.computeTriggerDate(scheduleEvent.eventDate, {
        dateMode: reminder.dateMode,
        offsetDays: reminder.offsetDays ?? undefined,
        manualDate: reminder.manualDate?.toISOString(),
      } as any);
    }

    return this.reminderEventRepository.save(reminder);
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const reminder = await this.findOne(id, userId, role);

    if (role !== UserRole.ROOT && reminder.scheduleEvent.product?.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以删除提醒');
    }

    reminder.isDeleted = true;
    await this.reminderEventRepository.save(reminder);
  }

  async toggleComplete(id: string, userId: string, role: UserRole): Promise<ReminderEvent> {
    const reminder = await this.findOne(id, userId, role);

    if (role !== UserRole.ROOT && reminder.scheduleEvent.product?.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以修改提醒状态');
    }

    reminder.completed = !reminder.completed;
    return this.reminderEventRepository.save(reminder);
  }
}