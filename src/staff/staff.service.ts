import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { User, UserType, UserStatus } from "../entities/user.entity";
import {
  CreateStaffDto,
  UpdateStaffDto,
  ChangeStaffStatusDto,
  StaffPaginationDto,
} from "./dto/staff.dto";
import { NotificationClientService } from "../send-notification/notification-client.service";
import { S3Service } from "../s3/s3.service";
import * as crypto from "crypto";
import { sqlSortOrder } from "../common/sql-sort.util";

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly notificationClient: NotificationClientService,
    private readonly s3Service: S3Service,
  ) {}

  private generateTempPassword(length = 10): string {
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    const bytes = crypto.randomBytes(length);
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars[bytes[i] % chars.length];
    }
    return password;
  }

  private async generateDisplayId(): Promise<string> {
    const result = await this.dataSource.query(
      `SELECT CONCAT('S-', LPAD(nextval('users_display_seq')::text, 6, '0')) AS display_id`,
    );
    return result[0].display_id;
  }

  private async populate(user: Omit<User, "passwordHash">): Promise<object> {
    const result: any = { ...user };
    result.image = this.s3Service.getPublicUrl(user.image);

    if (user.roleId) {
      const role = await this.dataSource.query(
        `SELECT id, role_name AS "roleName", description, status FROM roles WHERE id = $1 AND is_deleted = false`,
        [user.roleId],
      );
      result.role = role[0] ?? null;

      const permissions = await this.dataSource.query(
        `SELECT pl.id, pl.public_id AS "publicId",
              pl.is_add AS "isAdd", pl.is_edit AS "isEdit",
              pl.is_list AS "isList", pl.is_list AS "isList",
              pl.is_delete AS "isDelete", pl.is_view AS "isView",
              pl.status,
              rm.id AS "moduleId", rm.module_name AS "moduleName",
              rm.parent_id AS "parentId",
              parent_rm.id AS "parentModuleId",
              parent_rm.module_name AS "parentModuleName"
       FROM permission_list pl
       LEFT JOIN roles_module rm ON rm.id = pl.module_id AND rm.is_deleted = false
       LEFT JOIN roles_module parent_rm ON parent_rm.id = rm.parent_id AND parent_rm.is_deleted = false
       WHERE pl.role_id = $1 AND pl.is_deleted = false`,
        [user.roleId],
      );

      const parentMap: Record<string, any> = {};
      const grouped: any[] = [];

      for (const p of permissions ?? []) {
        if (!p.parentId) {
          parentMap[p.moduleId] = { ...p, children: [] };
          grouped.push(parentMap[p.moduleId]);
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
              isReply: false,
              status: false,
              children: [],
            };
            parentMap[p.parentId] = virtualParent;
            grouped.push(virtualParent);
          }
          parentMap[p.parentId].children.push(p);
        }
      }

      result.permissions = grouped;
    } else {
      result.role = null;
      result.permissions = [];
    }

    if (user.cityId) {
      const city = await this.dataSource.query(
        `SELECT c.id, c.city_name AS "cityName", c.status,
        s.id AS "stateId", s.state_name AS "stateName"
       FROM cities c
       LEFT JOIN states s ON s.id = c.state_id
       WHERE c.id = $1 AND c.is_deleted = false`,
        [user.cityId],
      );
      result.city = city[0] ?? null;
    } else {
      result.city = null;
    }

    return result;
  }

  async create(dto: CreateStaffDto, currentUserId?: string): Promise<object> {
    const existing = await this.userRepo.findOne({
      where: { email: dto.email, isDeleted: false },
    });
    if (existing) throw new ConflictException("Email already exists");

    if (dto.phoneNumber) {
      const existingPhone = await this.userRepo.findOne({
        where: { phoneNumber: dto.phoneNumber, isDeleted: false },
      });
      if (existingPhone)
        throw new ConflictException("Phone number already exists");
    }

    const rawPassword = this.generateTempPassword();

    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const entity = this.userRepo.create({
      publicId: uuidv4(),
      displayId: await this.generateDisplayId(),
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      email: dto.email,
      passwordHash: hashedPassword,
      phoneCountryCode: dto.countryCode ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      roleId: dto.roleId ?? null,
      gender: dto.gender ?? null,
      dateOfJoined: dto.dateOfJoined ? new Date(dto.dateOfJoined) : null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      cityId: dto.cityId ?? null,
      pinCode: dto.pinCode ?? null,
      image: dto.image ?? null,
      userType: UserType.STAFF,
      status: UserStatus.ACTIVE,
      isDeleted: false,
      isTemporaryPassword: true,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });

    const saved = await this.userRepo.save(entity);

    void this.notificationClient
      .sendLoginCredential(
        {
          to: saved.email,
          recipientName: `${saved.firstName} ${saved.lastName ?? ""}`.trim(),
        },
        rawPassword,
      )
      .catch((err) => {
        console.error("Failed to send credential email:", err);
      });

    return this.populate(this.excludePassword(saved));
  }

  async findAll(): Promise<object[]> {
    const data = await this.userRepo.find({
      where: { isDeleted: false, userType: UserType.STAFF },
      order: { createdAt: "DESC" },
    });
    return Promise.all(data.map((u) => this.populate(this.excludePassword(u))));
  }

  async findPaginated(query: StaffPaginationDto): Promise<object> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = sqlSortOrder(query.sortOrder);
    const skip = (page - 1) * limit;

    const qb = this.userRepo
      .createQueryBuilder("user")
      .where("user.is_deleted = false")
      .andWhere("user.user_type = :userType", { userType: UserType.STAFF });

    if (query.search) {
      qb.andWhere(
        "(user.first_name ILIKE :search OR user.last_name ILIKE :search OR user.email ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    if (query.roleId) {
      qb.andWhere("user.role_id = :roleId", { roleId: query.roleId });
    }

    if (query.status !== undefined) {
      qb.andWhere("user.status = :status", { status: query.status });
    }

    const sortMap: Record<string, string> = {
      id: "user.id",
      firstName: "user.first_name",
      email: "user.email",
      createdAt: "user.created_at",
      updatedAt: "user.updated_at",
    };
    const sortColumn = sortMap[sortBy] ?? "user.created_at";

    qb.orderBy(sortColumn, sortOrder).skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const populated = await Promise.all(
      data.map(async (u) => {
        let roleName: string | null = null;

        if (u.roleId) {
          const role = await this.dataSource.query(
            `SELECT role_name AS "roleName" FROM roles WHERE id = $1 AND is_deleted = false`,
            [u.roleId],
          );
          roleName = role[0]?.roleName ?? null;
        }

        return {
          id: u.id,
          displayId: u.displayId,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          // image: u.image,
          image: this.s3Service.getPublicUrl(u.image),
          role: roleName,
          phoneCountryCode: u.phoneCountryCode,
          phoneNumber: u.phoneNumber,
          status: u.status,
          lastLoginAt: u.lastLoginAt,
        };
      }),
    );

    return {
      data: populated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByIdAny(id: string): Promise<object> {
    const entity = await this.userRepo.findOne({
      where: { id, isDeleted: false },
    });
    if (!entity) throw new NotFoundException(`User ${id} not found`);
    return this.populate(this.excludePassword(entity));
  }

  async findOne(id: string): Promise<object> {
    const entity = await this.userRepo.findOne({
      where: { id, isDeleted: false, userType: UserType.STAFF },
    });
    if (!entity) throw new NotFoundException(`Staff ${id} not found`);
    return this.populate(this.excludePassword(entity));
  }

  // async update(
  //   id: string,
  //   dto: UpdateStaffDto,
  //   currentUserId?: string,
  // ): Promise<object> {
  //   const entity = await this.userRepo.findOne({
  //     where: { id, isDeleted: false, userType: UserType.STAFF },
  //   });
  //   if (!entity) throw new NotFoundException(`Staff ${id} not found`);

  //   // if (dto.email && dto.email !== entity.email) {
  //   //   const duplicate = await this.userRepo.findOne({
  //   //     where: { email: dto.email, isDeleted: false },
  //   //   });
  //   //   if (duplicate) throw new ConflictException("Email already exists");
  //   // }

  //   if (dto.email && dto.email !== entity.email) {
  //     const duplicate = await this.userRepo.findOne({
  //       where: { email: dto.email, isDeleted: false },
  //     });
  //     if (duplicate) throw new ConflictException("Email already exists");
  //   }

  //   if (dto.phoneNumber && dto.phoneNumber !== entity.phoneNumber) {
  //     const duplicatePhone = await this.userRepo.findOne({
  //       where: { phoneNumber: dto.phoneNumber, isDeleted: false },
  //     });
  //     if (duplicatePhone)
  //       throw new ConflictException("Phone number already exists");
  //   }

  //   Object.assign(entity, dto);
  //   if (dto.countryCode !== undefined)
  //     entity.phoneCountryCode = dto.countryCode ?? null;
  //   if (dto.dateOfJoined) entity.dateOfJoined = new Date(dto.dateOfJoined);
  //   if (dto.status !== undefined)
  //     entity.status = dto.status ? UserStatus.ACTIVE : UserStatus.INACTIVE;
  //   entity.updatedBy = currentUserId ?? null;

  //   const saved = await this.userRepo.save(entity);
  //   return this.populate(this.excludePassword(saved));
  // }

    async update(
    id: string,
    dto: UpdateStaffDto,
    currentUserId?: string,
  ): Promise<object> {
    const entity = await this.userRepo.findOne({
      where: { id, isDeleted: false, userType: UserType.STAFF },
    });
    if (!entity) throw new NotFoundException(`Staff ${id} not found`);

    if (dto.email && dto.email !== entity.email) {
      const duplicate = await this.userRepo.findOne({
        where: { email: dto.email, isDeleted: false },
      });
      if (duplicate) throw new ConflictException("Email already exists");
    }

    if (dto.phoneNumber && dto.phoneNumber !== entity.phoneNumber) {
      const duplicatePhone = await this.userRepo.findOne({
        where: { phoneNumber: dto.phoneNumber, isDeleted: false },
      });
      if (duplicatePhone)
        throw new ConflictException("Phone number already exists");
    }

    const previousRoleId = entity.roleId;
    const roleChanged =
      dto.roleId !== undefined && dto.roleId !== previousRoleId;

    Object.assign(entity, dto);
    if (dto.countryCode !== undefined)
      entity.phoneCountryCode = dto.countryCode ?? null;
    if (dto.dateOfJoined) entity.dateOfJoined = new Date(dto.dateOfJoined);
    if (dto.status !== undefined)
      entity.status = dto.status ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    entity.updatedBy = currentUserId ?? null;

    const saved = await this.userRepo.save(entity);

    if (roleChanged) {
      void this.notifyStaffRoleChanged(saved, previousRoleId, dto.roleId!);
    }

    return this.populate(this.excludePassword(saved));
  }

  /**
   * Fire-and-forget: email the staff member when their role is changed by an admin.
   * Never blocks or fails the PATCH response.
   */
  private async notifyStaffRoleChanged(
    staff: User,
    previousRoleId: string | null,
    newRoleId: string,
  ): Promise<void> {
    try {
      const [previousRoleRows, newRoleRows] = await Promise.all([
        previousRoleId
          ? this.dataSource.query(
              `SELECT role_name AS "roleName" FROM roles WHERE id = $1 AND is_deleted = false`,
              [previousRoleId],
            )
          : Promise.resolve([]),
        this.dataSource.query(
          `SELECT role_name AS "roleName" FROM roles WHERE id = $1 AND is_deleted = false`,
          [newRoleId],
        ),
      ]);

      if (!staff.email) {
        console.warn(
          `notifyStaffRoleChanged: staff ${staff.id} has no email on file; skipping`,
        );
        return;
      }

      await this.notificationClient.sendRoleChanged(
        {
          to: staff.email,
          recipientName: `${staff.firstName} ${staff.lastName ?? ""}`.trim(),
        },
        {
          previousRoleName: previousRoleRows?.[0]?.roleName ?? null,
          newRoleName: newRoleRows?.[0]?.roleName ?? "a new role",
        },
      );
    } catch (err) {
      console.error(
        `notifyStaffRoleChanged: failed for staff=${staff.id}:`,
        err,
      );
    }
  }

  async changeStatus(
    id: string,
    dto: ChangeStaffStatusDto,
    currentUserId?: string,
  ): Promise<object> {
    const entity = await this.userRepo.findOne({
      where: { id, isDeleted: false, userType: UserType.STAFF },
    });
    if (!entity) throw new NotFoundException(`Staff ${id} not found`);
    entity.status = dto.status ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    entity.updatedBy = currentUserId ?? null;
    const saved = await this.userRepo.save(entity);
    return this.populate(this.excludePassword(saved));
  }

  async remove(
    id: string,
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const entity = await this.userRepo.findOne({
      where: { id, isDeleted: false, userType: UserType.STAFF },
    });
    if (!entity) throw new NotFoundException(`Staff ${id} not found`);

    await this.userRepo.delete({ id });

    return { message: "Staff deleted successfully" };
  }

  async findAllAdminIds(): Promise<{ id: string; userType: UserType }[]> {
    const admins = await this.userRepo.find({
      where: {
        isDeleted: false,
        status: UserStatus.ACTIVE,
        userType: In([UserType.SUPER_ADMIN, UserType.ADMIN]),
      },
      select: ["id", "userType"],
    });
    return admins.map((a) => ({ id: a.id, userType: a.userType }));
  }


async findAllAdminEmails(): Promise<{ id: string; email: string }[]> {
  const admins = await this.userRepo.find({
    where: {
      userType: UserType.SUPER_ADMIN,
      isDeleted: false,
    },
    select: ["id", "email"],
  });
  return admins.map((a) => ({ id: a.id, email: a.email }));
}

  private excludePassword(user: User): Omit<User, "passwordHash"> {
    const { passwordHash, ...rest } = user;
    return rest as Omit<User, "passwordHash">;
  }
}
