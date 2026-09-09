import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as bcrypt from "bcrypt";
import { User, UserType, UserStatus } from "../entities/user.entity";
import { CreateUserDto } from "./dto/create-user.dto";
import { UserDb } from "../auth/interfaces/user-db.interface";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) { }

  async createUser(
    dto: CreateUserDto,
    currentUserId?: string,
  ): Promise<UserDb> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email.toLowerCase(), isDeleted: false },
    });
    if (existing)
      throw new ConflictException(
        `User with email ${dto.email} already exists`,
      );

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      publicId: uuidv4(),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName?.trim() ?? null,
      email: dto.email.toLowerCase(),
      passwordHash,
      phoneCountryCode: dto.countryCode ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      roleId: dto.roleId ?? null,
      gender: dto.gender ?? null,
      dateOfJoined: dto.dateOfJoined ? new Date(dto.dateOfJoined) : null,
      addressLine1: dto.addressLine1 ?? null,
      addressLine2: dto.addressLine2 ?? null,
      cityId: dto.cityId ?? null,
      pinCode: dto.pinCode ?? null,
      userType: dto.userType ?? UserType.STAFF,
      status: dto.status ?? UserStatus.ACTIVE,
      isDeleted: false,
      createdBy: currentUserId ?? null,
      updatedBy: currentUserId ?? null,
    });

    const saved = await this.userRepository.save(user);
    return this.toUserDb(saved);
  }

  async findAll(): Promise<UserDb[]> {
    const users = await this.userRepository.find({
      where: { isDeleted: false },
      order: { createdAt: "DESC" },
    });
    return users.map((u) => this.toUserDb(u));
  }

  async findById(id: string): Promise<UserDb> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    return this.toUserDb(user);
  }

  async findByEmailWithPassword(
    email: string,
  ): Promise<(UserDb & { passwordHash: string }) | null> {
    if (!email || typeof email !== "string") return null;
    const user = await this.userRepository.findOne({
      where: { email: email.toLowerCase().trim(), isDeleted: false },
    });
    if (!user) return null;
    return { ...this.toUserDb(user), passwordHash: user.passwordHash };
  }

  async update(
    id: string,
    partial: Partial<CreateUserDto>,
    currentUserId: string,
  ): Promise<UserDb> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);

    if (partial.email && partial.email.toLowerCase() !== user.email) {
      const existing = await this.userRepository.findOne({
        where: { email: partial.email.toLowerCase(), isDeleted: false },
      });
      if (existing)
        throw new ConflictException(
          `User with email ${partial.email} already exists`,
        );
      user.email = partial.email.toLowerCase();
    }

    if (partial.firstName !== undefined)
      user.firstName = partial.firstName.trim();
    if (partial.lastName !== undefined)
      user.lastName = partial.lastName?.trim() ?? null;
    if (partial.countryCode !== undefined)
      user.phoneCountryCode = partial.countryCode ?? null;
    if (partial.phoneNumber !== undefined)
      user.phoneNumber = partial.phoneNumber ?? null;
    if (partial.roleId !== undefined) user.roleId = partial.roleId ?? null;
    if (partial.gender !== undefined) user.gender = partial.gender ?? null;
    if (partial.dateOfJoined !== undefined)
      user.dateOfJoined = partial.dateOfJoined
        ? new Date(partial.dateOfJoined)
        : null;
    if (partial.addressLine1 !== undefined)
      user.addressLine1 = partial.addressLine1 ?? null;
    if (partial.addressLine2 !== undefined)
      user.addressLine2 = partial.addressLine2 ?? null;
    if (partial.cityId !== undefined) user.cityId = partial.cityId ?? null;
    if (partial.pinCode !== undefined) user.pinCode = partial.pinCode ?? null;
    if (partial.userType !== undefined) user.userType = partial.userType;
    if (partial.status !== undefined) user.status = partial.status;

    if (partial.password) {
      user.passwordHash = await bcrypt.hash(partial.password, 10);
    }

    user.updatedBy = currentUserId ?? null;

    const saved = await this.userRepository.save(user);
    return this.toUserDb(saved);
  }

  async remove(
    id: string,
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({
      where: { id, isDeleted: false },
    });
    if (!user) throw new NotFoundException(`User ${id} not found`);
    user.isDeleted = true;
    user.status = UserStatus.DELETED;
    user.updatedBy = currentUserId ?? null;
    await this.userRepository.save(user);
    return { message: "User deleted successfully" };
  }

  private toUserDb(user: User): UserDb {
    return {
      id: user.id,
      publicId: user.publicId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      countryCode: user.phoneCountryCode,
      phoneNumber: user.phoneNumber ?? "",
      roleId: user.roleId,
      gender: user.gender,
      dateOfJoined: user.dateOfJoined,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      cityId: user.cityId,
      pinCode: user.pinCode,
      image: user.image,
      userType: user.userType,
      lastLoginAt: user.lastLoginAt,
      status: user.status,
      createdBy: user.createdBy,
      updatedBy: user.updatedBy,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
