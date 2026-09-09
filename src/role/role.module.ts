import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../entities/role.entity';
import { PermissionList } from '../entities/permission-list.entity';
import { RolesModule as RolesModuleEntity } from '../entities/role-module.entity';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Role, PermissionList, RolesModuleEntity])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService],
})
export class RoleModule {}