import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TicketCategory } from "../entities/ticket-category.entity";
import { TicketCategoryService } from "./ticket-category.service";
import { TicketCategoryController } from "./ticket-category.controller";

@Module({
  imports: [TypeOrmModule.forFeature([TicketCategory])],
  controllers: [TicketCategoryController],
  providers: [TicketCategoryService],
  exports: [TicketCategoryService],
})
export class TicketCategoryModule {}