import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationService } from './notification.service';
import { ScheduleEvent } from '../schedule-event/entities/schedule-event.entity';
import { ReminderEvent } from '../reminder-event/entities/reminder-event.entity';
import { User } from '../user/entities/user.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([ScheduleEvent, ReminderEvent, User]),
  ],
  providers: [NotificationService],
})
export class NotificationModule {}