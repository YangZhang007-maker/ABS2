import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScheduleEvent } from './entities/schedule-event.entity';
import { Product } from '../product/entities/product.entity';
import { CreateScheduleEventDto, UpdateScheduleEventDto } from './dto/schedule-event.dto';
import { EVENT_TYPE_LABELS } from '../../common/enums/event-type.enum';
import { EventType } from '../../common/enums/event-type.enum';
import { ProductService } from '../product/product.service';
import { UserRole } from '../../common/enums/user-role.enum';
import { addTradingDays } from '../../common/utils/trading-day';

/**
 * 兑付日自动关联子事件定义
 * 每个事件: name=事件名称, offsetTradingDays=偏移交易日数, visibility='all'|'admin'
 */
const PAYMENT_SUB_EVENTS: { name: string; offsetTradingDays: number; visibility?: string }[] = [
  { name: '资产服务机构报告日', offsetTradingDays: -10 },
  { name: '托管银行核算日', offsetTradingDays: -10 },
  { name: '差额支付启动日', offsetTradingDays: -9 },
  { name: '差额支付划款日', offsetTradingDays: -8 },
  { name: '转付至托管户', offsetTradingDays: -8, visibility: 'admin' },
  { name: '托管银行报告日', offsetTradingDays: -6 },
  { name: '管理人报告日', offsetTradingDays: -5 },
  { name: '管理人分配日', offsetTradingDays: -3 },
  { name: '托管银行划款日', offsetTradingDays: -3 },
];

@Injectable()
export class ScheduleEventService {
  constructor(
    @InjectRepository(ScheduleEvent)
    private readonly scheduleEventRepository: Repository<ScheduleEvent>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly productService: ProductService,
  ) {}

  private getTypeLabel(eventType: string): string {
    // If it matches a known enum type, use the Chinese label; otherwise use the raw value
    if (Object.values(EventType).includes(eventType as EventType)) {
      return EVENT_TYPE_LABELS[eventType as EventType];
    }
    return eventType;
  }

  async findByProduct(productId: string, userId: string, role: UserRole): Promise<ScheduleEvent[]> {
    await this.productService.findOne(productId, userId, role);

    return this.scheduleEventRepository.find({
      where: { productId, isDeleted: false },
      relations: { product: true, reminderEvents: true },
      order: { eventDate: 'ASC' },
    });
  }

  async findOne(id: string, userId: string, role: UserRole): Promise<ScheduleEvent> {
    const event = await this.scheduleEventRepository.findOne({
      where: { id, isDeleted: false },
      relations: { product: true, reminderEvents: true },
    });
    if (!event) {
      throw new NotFoundException(`日程事件 "${id}" 未找到`);
    }

    await this.productService.findOne(event.productId, userId, role);
    return event;
  }

  async create(
    productId: string,
    dto: CreateScheduleEventDto,
    userId: string,
    role: UserRole,
  ): Promise<ScheduleEvent> {
    const product = await this.productRepository.findOne({
      where: { id: productId, isDeleted: false },
    });
    if (!product) {
      throw new NotFoundException(`产品 "${productId}" 未找到`);
    }

    if (role !== UserRole.ROOT && product.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以创建日程');
    }

    const typeLabel = this.getTypeLabel(dto.eventType);
    let scheduleName = `${product.name}-${typeLabel}`;
    if (dto.remark) {
      scheduleName += `-${dto.remark}`;
    }

    const event = this.scheduleEventRepository.create({
      productId,
      eventType: dto.eventType,
      scheduleName,
      remark: dto.remark || undefined,
      eventDate: new Date(dto.eventDate),
    });
    const savedEvent = await this.scheduleEventRepository.save(event);

    // 如果创建的是兑付日，自动生成关联子事件
    if (dto.eventType === EventType.PAYMENT) {
      await this.createPaymentSubEvents(savedEvent, product, dto.remark);
    }

    // 如果创建的是设立日，自动生成中基协备案事件
    if (dto.eventType === EventType.ESTABLISHMENT) {
      await this.createEstablishmentSubEvent(savedEvent, product, dto.remark);
    }

    return savedEvent;
  }

  /**
   * 设立日 → 中基协备案（设立日后 5 个交易日，仅 root/root2 可见）
   */
  private async createEstablishmentSubEvent(
    establishmentEvent: ScheduleEvent,
    product: Product,
    remark?: string,
  ): Promise<void> {
    const estDate = new Date(establishmentEvent.eventDate);
    const filingDate = addTradingDays(estDate, +5);
    const remarkSuffix = remark ? `(${remark})` : '';

    const filingEvent = this.scheduleEventRepository.create({
      productId: product.id,
      eventType: '中基协备案',
      scheduleName: `${product.name}-设立日${remarkSuffix}-中基协备案/T+5日`,
      remark: `关联设立日: ${establishmentEvent.scheduleName}`,
      eventDate: filingDate,
      visibility: 'admin',
    });

    await this.scheduleEventRepository.save(filingEvent);
  }

  /**
   * 根据兑付日自动创建关联子事件（T-n 交易日）
   */
  private async createPaymentSubEvents(
    paymentEvent: ScheduleEvent,
    product: Product,
    remark?: string,
  ): Promise<void> {
    const paymentDate = new Date(paymentEvent.eventDate);
    const paymentName = paymentEvent.scheduleName;

    const subEvents = PAYMENT_SUB_EVENTS.map((def) => {
      const subDate = addTradingDays(paymentDate, def.offsetTradingDays);
      // 命名格式: 产品名-兑付日(备注)-子事件名/T-n日
      const remarkSuffix = remark ? `(${remark})` : '';
      const scheduleName = `${product.name}-兑付日${remarkSuffix}-${def.name}/T${def.offsetTradingDays}日`;
      return this.scheduleEventRepository.create({
        productId: product.id,
        eventType: def.name,
        scheduleName,
        remark: `关联兑付日: ${paymentName}`,
        eventDate: subDate,
        visibility: def.visibility || 'all',
      });
    });

    await this.scheduleEventRepository.save(subEvents);
  }

  async update(id: string, dto: UpdateScheduleEventDto, userId: string, role: UserRole): Promise<ScheduleEvent> {
    const event = await this.findOne(id, userId, role);

    if (role !== UserRole.ROOT && event.product?.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以编辑日程');
    }

    const effectiveType = dto.eventType !== undefined ? dto.eventType : event.eventType;
    const effectiveRemark = dto.remark !== undefined ? dto.remark : (event.remark || '');

    if (dto.eventType !== undefined) {
      event.eventType = dto.eventType;
    }

    // Rebuild schedule name
    const product = await this.productRepository.findOne({
      where: { id: event.productId, isDeleted: false },
    });
    const typeLabel = this.getTypeLabel(effectiveType);
    let scheduleName = `${product?.name || ''}-${typeLabel}`;
    if (effectiveRemark) scheduleName += `-${effectiveRemark}`;
    event.scheduleName = scheduleName;

    if (dto.remark !== undefined) event.remark = dto.remark || '';
    if (dto.eventDate !== undefined) event.eventDate = new Date(dto.eventDate);

    return this.scheduleEventRepository.save(event);
  }

  async remove(id: string, userId: string, role: UserRole): Promise<void> {
    const event = await this.findOne(id, userId, role);

    if (role !== UserRole.ROOT && event.product?.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以删除日程');
    }

    event.isDeleted = true;
    await this.scheduleEventRepository.save(event);
  }

  async toggleComplete(id: string, userId: string, role: UserRole): Promise<ScheduleEvent> {
    const event = await this.findOne(id, userId, role);

    if (role !== UserRole.ROOT && event.product?.creatorId !== userId) {
      throw new ForbiddenException('只有产品负责人或总负责人可以修改日程状态');
    }

    event.completed = !event.completed;
    return this.scheduleEventRepository.save(event);
  }
}