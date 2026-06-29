import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReminderEvent } from './entities/reminder-event.entity';
import { ScheduleEvent } from '../schedule-event/entities/schedule-event.entity';
import { ReminderEventService } from './reminder-event.service';
import { ReminderEventController } from './reminder-event.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([ReminderEvent, ScheduleEvent]), ProductModule],
  controllers: [ReminderEventController],
  providers: [ReminderEventService],
  exports: [ReminderEventService],
})
export class ReminderEventModule {}