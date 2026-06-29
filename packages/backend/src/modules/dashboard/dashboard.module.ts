import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleEvent } from '../schedule-event/entities/schedule-event.entity';
import { ReminderEvent } from '../reminder-event/entities/reminder-event.entity';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleEvent, ReminderEvent]), ProductModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}