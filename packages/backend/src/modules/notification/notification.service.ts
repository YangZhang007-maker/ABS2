import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ScheduleEvent } from '../schedule-event/entities/schedule-event.entity';
import { ReminderEvent } from '../reminder-event/entities/reminder-event.entity';
import { User } from '../user/entities/user.entity';
import dayjs from 'dayjs';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private transporter;

  constructor(
    @InjectRepository(ScheduleEvent)
    private readonly scheduleEventRepository: Repository<ScheduleEvent>,
    @InjectRepository(ReminderEvent)
    private readonly reminderEventRepository: Repository<ReminderEvent>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.qq.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });
  }

  /**
   * Send reminder emails for today's events at 9:00 AM every day
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async sendDailyReminders() {
    this.logger.log('开始发送每日提醒邮件...');

    try {
      await this.sendTodayScheduleEvents();
      await this.sendTodayReminderEvents();
    } catch (e) {
      this.logger.error('发送提醒邮件失败', e);
    }
  }

  private async sendTodayScheduleEvents() {
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().endOf('day').toDate();

    const events = await this.scheduleEventRepository
      .createQueryBuilder('se')
      .leftJoinAndSelect('se.product', 'product')
      .leftJoin('product', 'p')
      .leftJoin('users', 'u', 'u.id = p.creator_id')
      .where('se.is_deleted = :deleted', { deleted: false })
      .andWhere('se.completed = :completed', { completed: false })
      .andWhere('se.event_date >= :today', { today })
      .andWhere('se.event_date <= :tomorrow', { tomorrow })
      .getMany();

    for (const event of events) {
      const product = event.product;
      if (!product?.creatorId) continue;

      const user = await this.userRepository.findOne({
        where: { id: product.creatorId, isDeleted: false },
      });

      if (!user?.email) continue;

      const html = this.buildScheduleEmail(product.name, event.scheduleName, event.eventDate);
      await this.sendEmail(user.email, `【ABS提醒】日程事件：${event.scheduleName}`, html);
      this.logger.log(`日程提醒邮件已发送至 ${user.email}: ${event.scheduleName}`);
    }
  }

  private async sendTodayReminderEvents() {
    const today = dayjs().startOf('day').toDate();
    const tomorrow = dayjs().endOf('day').toDate();

    const events = await this.reminderEventRepository
      .createQueryBuilder('re')
      .leftJoinAndSelect('re.scheduleEvent', 'se')
      .leftJoinAndSelect('se.product', 'product')
      .where('re.is_deleted = :deleted', { deleted: false })
      .andWhere('re.completed = :completed', { completed: false })
      .andWhere('re.trigger_date >= :today', { today })
      .andWhere('re.trigger_date <= :tomorrow', { tomorrow })
      .getMany();

    for (const event of events) {
      const product = event.scheduleEvent?.product;
      if (!product?.creatorId) continue;

      const user = await this.userRepository.findOne({
        where: { id: product.creatorId, isDeleted: false },
      });

      if (!user?.email) continue;

      const relatedName = event.scheduleEvent?.scheduleName || '';
      const html = this.buildReminderEmail(product.name, event.reminderName, relatedName, event.triggerDate);
      await this.sendEmail(user.email, `【ABS提醒】提醒事件：${event.reminderName}`, html);
      this.logger.log(`提醒邮件已发送至 ${user.email}: ${event.reminderName}`);
    }
  }

  private buildScheduleEmail(productName: string, eventName: string, eventDate: Date): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1890ff;">ABS 存续期智能提醒系统</h2>
        <p>您好，您有一个日程事件在今天：</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #fafafa;">产品</td><td style="padding: 8px; border: 1px solid #eee;">${productName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #fafafa;">事件名称</td><td style="padding: 8px; border: 1px solid #eee;">${eventName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #fafafa;">事件日期</td><td style="padding: 8px; border: 1px solid #eee;">${dayjs(eventDate).format('YYYY-MM-DD')}</td></tr>
        </table>
        <p style="color: #8c8c8c; font-size: 12px; margin-top: 20px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `;
  }

  private buildReminderEmail(productName: string, reminderName: string, relatedName: string, triggerDate: Date): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1890ff;">ABS 存续期智能提醒系统</h2>
        <p>您好，您有一个提醒事件在今天：</p>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #fafafa;">产品</td><td style="padding: 8px; border: 1px solid #eee;">${productName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #fafafa;">提醒名称</td><td style="padding: 8px; border: 1px solid #eee;">${reminderName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #fafafa;">关联日程</td><td style="padding: 8px; border: 1px solid #eee;">${relatedName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #eee; background: #fafafa;">提醒日期</td><td style="padding: 8px; border: 1px solid #eee;">${dayjs(triggerDate).format('YYYY-MM-DD')}</td></tr>
        </table>
        <p style="color: #8c8c8c; font-size: 12px; margin-top: 20px;">此邮件由系统自动发送，请勿回复。</p>
      </div>
    `;
  }

  private async sendEmail(to: string, subject: string, html: string) {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@abs.com',
      to,
      subject,
      html,
    });
  }
}