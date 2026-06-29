import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import databaseConfig from './config/database.config';
import { ProductModule } from './modules/product/product.module';
import { ScheduleEventModule } from './modules/schedule-event/schedule-event.module';
import { ReminderEventModule } from './modules/reminder-event/reminder-event.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DocumentModule } from './modules/document/document.module';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationModule } from './modules/notification/notification.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
    }),
    ProductModule,
    ScheduleEventModule,
    ReminderEventModule,
    DashboardModule,
    DocumentModule,
    UserModule,
    AuthModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}