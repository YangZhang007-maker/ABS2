import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('schedule')
  getSchedule(
    @Query('productId') productId: string,
    @Query('completed') completed: string,
    @Query('search') search: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @CurrentUser() user: any,
  ) {
    const showCompleted = completed === 'true';
    return this.dashboardService.getSchedule(
      productId,
      user.id,
      user.role,
      showCompleted,
      search || undefined,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}