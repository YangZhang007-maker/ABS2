import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, UseGuards,
} from '@nestjs/common';
import { ReminderEventService } from './reminder-event.service';
import { CreateReminderEventDto, UpdateReminderEventDto } from './dto/reminder-event.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ReminderEventController {
  constructor(private readonly reminderEventService: ReminderEventService) {}

  @Get('schedule-events/:sid/reminders')
  findByScheduleEvent(@Param('sid') scheduleEventId: string, @CurrentUser() user: any) {
    return this.reminderEventService.findByScheduleEvent(scheduleEventId, user.id, user.role);
  }

  @Post('schedule-events/:sid/reminders')
  create(
    @Param('sid') scheduleEventId: string,
    @Body() dto: CreateReminderEventDto,
    @CurrentUser() user: any,
  ) {
    return this.reminderEventService.create(scheduleEventId, dto, user.id, user.role);
  }

  @Patch('reminders/:id')
  update(@Param('id') id: string, @Body() dto: UpdateReminderEventDto, @CurrentUser() user: any) {
    return this.reminderEventService.update(id, dto, user.id, user.role);
  }

  @Delete('reminders/:id')
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reminderEventService.remove(id, user.id, user.role);
  }

  @Patch('reminders/:id/toggle-complete')
  toggleComplete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.reminderEventService.toggleComplete(id, user.id, user.role);
  }
}