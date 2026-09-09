import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RolesModule as RolesModuleEntity } from '../entities/role-module.entity';
import { RolesModuleService } from './role-module.service';
import { RolesModuleController } from './role-module.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RolesModuleEntity])],
  controllers: [RolesModuleController],
  providers: [RolesModuleService],
  exports: [RolesModuleService],
})
export class RolesModuleModule {}