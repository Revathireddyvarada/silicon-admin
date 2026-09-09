import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { User } from '../entities/user.entity';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { NotificationClientService } from '../send-notification/notification-client.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    HttpModule,
    S3Module
  ],
  controllers: [StaffController],
  providers: [StaffService, NotificationClientService],
  exports: [StaffService],
})
export class StaffModule {}