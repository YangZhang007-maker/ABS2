import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ScheduleEventService } from './schedule-event.service';
import { CreateScheduleEventDto, UpdateScheduleEventDto } from './dto/schedule-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ScheduleEventController {
  constructor(private readonly scheduleEventService: ScheduleEventService) {}

  @Get('schedule-events/:id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.scheduleEventService.findOne(id, user.id, user.role);
  }

  @Get('products/:pid/schedule-events')
  findByProduct(@Param('pid') productId: string, @CurrentUser() user: any) {
    return this.scheduleEventService.findByProduct(productId, user.id, user.role);
  }

  @Post('products/:pid/schedule-events')
  create(
    @Param('pid') productId: string,
    @Body() dto: CreateScheduleEventDto,
    @CurrentUser() user: any,
  ) {
    return this.scheduleEventService.create(productId, dto, user.id, user.role);
  }

  @Patch('schedule-events/:id')
  update(@Param('id') id: string, @Body() dto: UpdateScheduleEventDto, @CurrentUser() user: any) {
    return this.scheduleEventService.update(id, dto, user.id, user.role);
  }

  @Delete('schedule-events/:id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.scheduleEventService.remove(id, user.id, user.role);
  }

  @Patch('schedule-events/:id/toggle-complete')
  toggleComplete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.scheduleEventService.toggleComplete(id, user.id, user.role);
  }
}