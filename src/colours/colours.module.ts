import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Colour } from '../entities/colours.entity';
import { ColoursService } from './colours.service';
import { ColoursController } from './colours.controller';

@Module({
  imports  : [TypeOrmModule.forFeature([Colour])],
  controllers: [ColoursController],
  providers  : [ColoursService],
  exports    : [ColoursService],
})
export class ColoursModule {}