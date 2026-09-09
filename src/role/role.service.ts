import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { Role } from "../entities/role.entity";
import { PermissionList } from "../entities/permission-list.entity";
import {
  CreateRoleDto,
  UpdateRoleDto,
  ChangeRoleStatusDto,
  AssignPermissionsDto,
  RolePaginationDto,
} from "./dto/role.dto";
import { sqlSortOrder } from "../common/sql-sort.util";

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(PermissionList)
    private readonly permissionRepo: Repository<PermissionList>,

    private readonly dataSource: DataSource,
  ) {}

  private async generateDisplayId(): Promise<string> {
    const result = await this.dataSource.query(
      `SELECT CONCAT('R-', LPAD(nextval('roles_display_seq')::text, 6, '0')) AS display_id`,
    );
    return result[0].display_id;
  }

  private async populatePermissions(roleId: string): Promise<object[]> {
    const permissions = await this.dataSource.query(
      `SELECT
     pl.id, pl.public_id AS "publicId",
     pl.role_id AS "roleId",
     pl.is_add AS "isAdd",
     pl.is_list AS "isList",
     pl.is_edit AS "isEdit",
     pl.is_delete AS "isDelete",
     pl.is_view AS "isView",
     pl.is_active AS "isActive",
     pl.status,
     rm.id AS "moduleId",
     rm.module_name AS "moduleName",
     rm.parent_id AS "parentId",
     rm.status AS "moduleStatus",
     parent_rm.id AS "parentModuleId",
     parent_rm.module_name AS "parentModuleName"
   FROM permission_list pl
   LEFT JOIN roles_module rm ON rm.id = pl.module_id AND rm.is_deleted = false
   LEFT JOIN roles_module parent_rm ON parent_rm.id = rm.parent_id AND parent_rm.is_deleted = false
   WHERE pl.role_id = $1 AND pl.is_deleted = false`,
      [roleId],
    );

    const parentMap: Record<string, any> = {};
    const result: any[] = [];

    for (const p of permissions ?? []) {
      if (!p.parentId) {
        parentMap[p.moduleId] = { ...p, children: [] };
        result.push(parentMap[p.moduleId]);
      } else {
        if (!parentMap[p.parentId]) {
          const virtualParent = {
            moduleId: p.parentModuleId,
            moduleName: p.parentModuleName,
            parentId: null,
            isAdd: false,
            isList: false,
            isEdit: false,
            isDelete: false,
            isView: false,
            // isReply: false,
            isActive: false,
            status: false,
            children: [],
          };
          parentMap[p.parentId] = virtualParent;
          result.push(virtualParent);
        }
        parentMap[p.parentId].children.push(p);
      }
    }

    return result;
  }

  async create(dto: CreateRoleDto, currentUserId?: string): Promise<object> {
    const existing = await this.roleRepo.findOne({
      where: { roleName: dto.roleName, isDeleted: false },
    });
    if (existing)
      throw new ConflictException(`Role '${dto.roleName}' already exists`);

    const entity = this.roleRepo.create({
      publicId: uuidv4(),
      displayId: await this.generateDisplayId(),
      roleName: dto.roleName,
      description: dto.description ?? null,
      status: dto.status ?? true,
      isDeleted: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });
    const saved = await this.roleRepo.save(entity);

    if (dto.permissions?.length) {
      const permEntities = dto.permissions.map((p) =>
        this.permissionRepo.create({
          publicId: uuidv4(),
          roleId: saved.id,
          moduleId: p.moduleId,
          isAdd: p.isAdd ?? false,
          isList: p.isList ?? false,
          isEdit: p.isEdit ?? false,
          isDelete: p.isDelete ?? false,
          isView: p.isView ?? false,
          // isReply: p.isReply ?? false,
          isActive: p.isActive ?? true,
          isDeleted: false,
          status: true,
          createdBy: currentUserId ?? null,
          updatedBy: currentUserId ?? null,
        }),
      );
      await this.permissionRepo.save(permEntities);
    }

    const permissions = await this.populatePermissions(saved.id);
    return { ...saved, permissions };
  }

  async findAll(): Promise<object[]> {
    const roles = await this.roleRepo.find({
      where: { isDeleted: false },
      order: { createdAt: "DESC" },
    });

    return Promise.all(
      roles.map(async (role) => ({
        ...role,
        permissions: await this.populatePermissions(role.id),
      })),
    );
  }

  async findPaginated(query: RolePaginationDto): Promise<object> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = sqlSortOrder(query.sortOrder);
    const skip = (page - 1) * limit;

    const where: any = { isDeleted: false };
    if (query.search) where.roleName = Like(`%${query.search}%`);

    const sortColumnMap: Record<string, string> = {
      id: "id",
      roleName: "roleName",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };
    const orderColumn = sortColumnMap[sortBy] ?? "createdAt";

    const [roles, total] = await this.roleRepo.findAndCount({
      where,
      order: { [orderColumn]: sortOrder },
      skip,
      take: limit,
    });

    const data = roles.map((role) => ({
      id: role.id,
      displayId: role.displayId,
      roleName: role.roleName,
      status: role.status,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<object> {
    const role = await this.roleRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    const permissions = await this.populatePermissions(id);
    return { ...role, permissions };
  }

  async update(
    id: string,
    dto: UpdateRoleDto,
    currentUserId?: string,
  ): Promise<object> {
    const role = await this.roleRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    if (dto.roleName && dto.roleName !== role.roleName) {
      const existing = await this.roleRepo.findOne({
        where: { roleName: dto.roleName, isDeleted: false },
      });
      if (existing)
        throw new ConflictException(`Role '${dto.roleName}' already exists`);
    }

    Object.assign(role, dto);
    role.updatedBy = currentUserId ?? null;
    const saved = await this.roleRepo.save(role);

    if (dto.permissions?.length) {
      await this.permissionRepo
        .createQueryBuilder()
        .update(PermissionList)
        .set({ isDeleted: true, updatedBy: currentUserId ?? null })
        .where("role_id = :id AND is_deleted = false", { id })
        .execute();

      const permEntities = dto.permissions.map((p) =>
        this.permissionRepo.create({
          publicId: uuidv4(),
          roleId: saved.id,
          moduleId: p.moduleId,
          isAdd: p.isAdd ?? false,
          isList: p.isList ?? false,
          isEdit: p.isEdit ?? false,
          isDelete: p.isDelete ?? false,
          isView: p.isView ?? false,
          // isReply: p.isReply ?? false,
          isActive: p.isActive ?? true,
          isDeleted: false,
          status: true,
          createdBy: currentUserId ?? null,
          updatedBy: currentUserId ?? null,
        }),
      );
      await this.permissionRepo.save(permEntities);
    }

    const permissions = await this.populatePermissions(saved.id);
    return { ...saved, permissions };
  }

  async changeStatus(
    id: string,
    dto: ChangeRoleStatusDto,
    currentUserId?: string,
  ): Promise<object> {
    const role = await this.roleRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    role.status = dto.status;
    role.updatedBy = currentUserId ?? null;
    const saved = await this.roleRepo.save(role);
    const permissions = await this.populatePermissions(saved.id);
    return { ...saved, permissions };
  }

  async remove(
    id: string,
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const role = await this.roleRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);
    role.isDeleted = true;
    role.updatedBy = currentUserId ?? null;
    await this.roleRepo.save(role);
    return { message: "Role deleted successfully" };
  }

  async assignPermissions(
    id: string,
    dto: AssignPermissionsDto,
    currentUserId?: string,
  ): Promise<object> {
    const role = await this.roleRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!role) throw new NotFoundException(`Role ${id} not found`);

    await this.permissionRepo
      .createQueryBuilder()
      .update(PermissionList)
      .set({ isDeleted: true, updatedBy: currentUserId ?? null })
      .where("role_id = :id AND is_deleted = false", { id })
      .execute();

    const entities = dto.permissions.map((p) =>
      this.permissionRepo.create({
        publicId: uuidv4(),
        roleId: id,
        moduleId: p.moduleId,
        isAdd: p.isAdd ?? false,
        isList: p.isList ?? false,
        isEdit: p.isEdit ?? false,
        isDelete: p.isDelete ?? false,
        isView: p.isView ?? false,
        // isReply: p.isReply ?? false,
        isActive: p.isActive ?? true,
        isDeleted: false,
        status: true,
        createdBy: currentUserId ?? null,
        updatedBy: currentUserId ?? null,
      }),
    );
    await this.permissionRepo.save(entities);

    const permissions = await this.populatePermissions(id);
    return { ...role, permissions };
  }
}
