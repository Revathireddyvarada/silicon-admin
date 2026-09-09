import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TripRatingReason } from '../entities/trip-rating-reason.entity';
import { TripRatingReasonsService } from './trip-rating-reasons.service';
import { TripRatingReasonsController } from './trip-rating-reasons.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TripRatingReason])],
  controllers: [TripRatingReasonsController],
  providers: [TripRatingReasonsService],
  exports: [TripRatingReasonsService],
})
export class TripRatingReasonsModule {}
