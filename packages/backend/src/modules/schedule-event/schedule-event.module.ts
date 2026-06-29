import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleEvent } from './entities/schedule-event.entity';
import { Product } from '../product/entities/product.entity';
import { ScheduleEventService } from './schedule-event.service';
import { ScheduleEventController } from './schedule-event.controller';
import { ProductModule } from '../product/product.module';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduleEvent, Product]), ProductModule],
  controllers: [ScheduleEventController],
  providers: [ScheduleEventService],
  exports: [ScheduleEventService],
})
export class ScheduleEventModule {}