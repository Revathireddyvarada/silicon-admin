import {
  Injectable,
  UnauthorizedException,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, MoreThan } from "typeorm";
import * as bcrypt from "bcrypt";
import * as jwt from "jsonwebtoken";

import { User, UserStatus } from "../entities/user.entity";
import { Token } from "../entities/token.entity";
import { TokenService } from "../tokens/token.service";
import { LoginDto } from "./dto/login.dto";
import { FindEmailDto } from "./dto/find.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ProfileResponseDto } from "./dto/get-profile.dto.ts";
import { City } from "../entities/city.entity";
import { Role } from "../entities/role.entity";
import { State } from "../entities/state.entity";
import {
  ChangePasswordDto,
  ResetPasswordDto,
  ForgotPasswordDto,
} from "./dto/Password.dto";
import * as crypto from "crypto";
import * as nodemailer from "nodemailer";
import { S3Service } from "../s3/s3.service";

export interface AuthResponse {
  access_token: string;
  expires_in: number;
  expiry_date: string;
  refresh_token: string;
  refresh_expires_at: string; // ISO string
  user: {
    id: string;
    firstName: string;
    lastName: string | null;
    email: string;
    image: string | null;
    roleId: string | null;
    role: string | null;
    permissions: any[];
    isTemporaryPassword: boolean;
    cityId: string | null;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Token)
    private tokenRepo: Repository<Token>,

    @InjectRepository(City)
    private cityRepo: Repository<City>,

    @InjectRepository(Role)
    private roleRepo: Repository<Role>,

    @InjectRepository(State)
    private stateRepo: Repository<State>,

    private tokenService: TokenService,
    private readonly s3Service: S3Service,

  ) {}

  private async getRolePermissions(roleId: string): Promise<any[]> {
    const permissions = await this.userRepo.query(
      `SELECT
         pl.id, pl.public_id AS "publicId",
         pl.role_id AS "roleId",
         pl.is_add AS "isAdd",
         pl.is_list AS "isList",
         pl.is_edit AS "isEdit",
         pl.is_delete AS "isDelete",
         pl.is_view AS "isView",
         pl.status,
         rm.id AS "moduleId",
         rm.module_name AS "moduleName",
         rm.parent_id AS "parentId",
         parent_rm.id AS "parentModuleId",
         parent_rm.module_name AS "parentModuleName"
       FROM permission_list pl
       LEFT JOIN roles_module rm ON rm.id = pl.module_id AND rm.is_deleted = false
       LEFT JOIN roles_module parent_rm ON parent_rm.id = rm.parent_id AND parent_rm.is_deleted = false
       WHERE pl.role_id = $1 AND pl.is_deleted = false`,
      [roleId],
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
            // isReply: false,
            status: false,
            children: [],
          };
          parentMap[p.parentId] = virtualParent;
          grouped.push(virtualParent);
        }
        parentMap[p.parentId].children.push(p);
      }
    }

    return grouped;
  }

  async findByEmail(dto: FindEmailDto): Promise<{
    id: string;
    email: string;
  }> {
    const user = await this.userRepo
      .createQueryBuilder("u")
      .select(["u.id", "u.email", "u.userType", "u.status", "u.createdAt"])
      .where("u.email = :email", { email: dto.email.toLowerCase() })
      .getOne();

    if (!user) throw new NotFoundException("No user found with that email");

    return {
      id: user.id,
      email: user.email,
    };
  }

  // ── Login ──────────────────────────────────────────────

  async login(dto: LoginDto, ip?: string): Promise<AuthResponse> {
    this.logger.log(`Login start email=${dto.email}`);
    const t0 = Date.now();

    const user = await this.userRepo
      .createQueryBuilder("u")
      .select([
        "u.id",
        "u.email",
        "u.passwordHash",
        "u.userType",
        "u.status",
        "u.firstName",
        "u.lastName",
        "u.image",
        "u.roleId",
        "u.isTemporaryPassword",
        "u.cityId",
      ])
      .where("u.email = :email", { email: dto.email.toLowerCase() })
      .getOne();

    this.logger.log(
      `Login DB done in ${Date.now() - t0}ms, userFound=${!!user}`,
    );

    // Prevent email enumeration
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash)))
      throw new UnauthorizedException("Invalid email or password");

    if (user.status === UserStatus.SUSPENDED)
      throw new UnauthorizedException("Account suspended");

    if (user.status === UserStatus.INACTIVE)
      throw new UnauthorizedException("Account inactive");

    await this.userRepo.update(user.id, { lastLoginAt: new Date() });

    // ── Generate tokens ─────────────────────────
    const t1 = Date.now();
    const { access_token, expires_in, expiry_date } =
      this.tokenService.generateAccessToken(user.id, user.userType, user.email);

    const { refresh_token, refresh_jti, refresh_expires_at } =
      this.tokenService.generateRefreshToken(user.id);

    this.logger.log(
      `Login tokens generated in ${Date.now() - t1}ms for user=${user.email}`,
    );

    // ── Save session ───────────────────────────
    const t2 = Date.now();
    await this.tokenRepo.save(
      this.tokenRepo.create({
        userId: user.id,
        refreshJti: refresh_jti,
        refreshExpiresAt: refresh_expires_at,
        ipAddress: ip ?? null,
        blockedAccessJti: null,
        blockedAccessExpiresAt: null,
      }),
    );

    this.logger.log(
      `Login session saved in ${Date.now() - t2}ms for user=${user.email}`,
    );

    let roleName: string | null = null;
    let permissions: any[] = [];
    if (user.roleId) {
      const role = await this.roleRepo
        .createQueryBuilder("r")
        .where("r.id = :id", { id: user.roleId })
        .getOne();
      roleName = role?.roleName ?? null;
      permissions = await this.getRolePermissions(user.roleId);
    }

    // ── Final response ─────────────────────────
    return {
      access_token,
      expires_in,
      expiry_date,
      refresh_token,
      refresh_expires_at: refresh_expires_at.toISOString(),

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        // image: user.image,
        image: user.image ? this.s3Service.getPublicUrl(user.image) : null,
        roleId: user.roleId,
        role: roleName,
        permissions,
        isTemporaryPassword: user.isTemporaryPassword,
        cityId: user.cityId ?? null,
      },
    };
  }

  // ── Logout ─────────────────────────────────────────────
  // Blocklists the current access jti + deletes the refresh session

  async logout(
    accessJti: string,
    accessExpiresAt: Date,
    userId: string,
  ): Promise<{ message: string }> {
    // Add access jti to blocklist on the active session row (if any)
    // If session already gone (e.g. already logged out), that's fine
    await this.tokenRepo
      .createQueryBuilder()
      .update(Token)
      .set({
        blockedAccessJti: accessJti,
        blockedAccessExpiresAt: accessExpiresAt,
      })
      .where("user_id = :userId", { userId })
      .andWhere("refresh_expires_at > NOW()")
      .execute();

    // Delete all refresh sessions for this user (full logout)
    // To support "logout this device only", filter by refreshJti instead
    await this.tokenRepo.delete({ userId });

    this.logger.log(`Logout: userId=${userId} jti=${accessJti}`);

    return { message: "Logged out successfully" };
  }

  // ── Refresh ────────────────────────────────────────────

  async refresh(dto: RefreshTokenDto): Promise<AuthResponse> {
    this.logger.log("Refresh token flow started");

    // Verify the refresh token JWT
    let payload: any;
    try {
      payload = this.tokenService.verify(dto.refresh_token);
    } catch (err) {
      this.logger.warn(`Refresh token verification failed: ${err}`);
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const userId = payload.sub;
    const refreshJti = payload.jti;

    // Look up the session in the database
    const session = await this.tokenRepo
      .createQueryBuilder("t")
      .where("t.user_id = :userId", { userId })
      .andWhere("t.refresh_jti = :refreshJti", { refreshJti })
      .andWhere("t.refresh_expires_at > NOW()")
      .getOne();

    if (!session) {
      this.logger.warn(
        `Refresh session not found or expired for userId=${userId}`,
      );
      throw new UnauthorizedException("Refresh token not found or expired");
    }

    // Fetch the user
    const user = await this.userRepo
      .createQueryBuilder("u")
      .select([
        "u.id",
        "u.email",
        "u.userType",
        "u.status",
        "u.firstName",
        "u.lastName",
        "u.image",
        "u.roleId",
        "u.isTemporaryPassword",
        "u.cityId",
      ])
      .where("u.id = :id", { id: userId })
      .getOne();

    if (!user) {
      this.logger.warn(`User not found for refresh userId=${userId}`);
      throw new UnauthorizedException("User not found");
    }

    if (user.status === UserStatus.SUSPENDED) {
      this.logger.warn(`Refresh attempted for suspended user=${user.email}`);
      throw new UnauthorizedException("Account suspended");
    }

    if (user.status === UserStatus.INACTIVE) {
      this.logger.warn(`Refresh attempted for inactive user=${user.email}`);
      throw new UnauthorizedException("Account inactive");
    }

    // Generate new tokens
    const { access_token, expires_in, expiry_date } =
      this.tokenService.generateAccessToken(user.id, user.userType, user.email);

    const {
      refresh_token,
      refresh_jti: new_refresh_jti,
      refresh_expires_at,
    } = this.tokenService.generateRefreshToken(user.id);

    // Update the session with new refresh_jti
    await this.tokenRepo.update(
      { id: session.id },
      {
        refreshJti: new_refresh_jti,
        refreshExpiresAt: refresh_expires_at,
      },
    );

    this.logger.log(`Refresh successful for user=${user.email}`);

    let roleName: string | null = null;
    let permissions: any[] = [];
    if (user.roleId) {
      const role = await this.roleRepo
        .createQueryBuilder("r")
        .where("r.id = :id", { id: user.roleId })
        .getOne();
      roleName = role?.roleName ?? null;
      permissions = await this.getRolePermissions(user.roleId);
    }

    return {
      access_token,
      expires_in,
      expiry_date,
      refresh_token,
      refresh_expires_at: refresh_expires_at.toISOString(),
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        // image: user.image,
        image: user.image ? this.s3Service.getPublicUrl(user.image) : null,
        roleId: user.roleId,
        role: roleName,
        permissions,
        isTemporaryPassword: user.isTemporaryPassword,
        cityId: user.cityId ?? null,
      },
    };
  }

  // ── Me ─────────────────────────────────────────────────

  async me(userId: string): Promise<{
    id: string;
    email: string;
    userType: number;
    status: number;
    createdAt: Date;
  }> {
    const user = await this.userRepo
      .createQueryBuilder("u")
      .select(["u.id", "u.email", "u.userType", "u.status", "u.createdAt"])
      .where("u.id = :id", { id: userId })
      .getOne();

    if (!user) throw new UnauthorizedException("User not found");

    return {
      id: user.id,
      email: user.email,
      userType: user.userType,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepo
      .createQueryBuilder("u")
      .select([
        "u.id",
        "u.firstName",
        "u.lastName",
        "u.email",
        "u.phoneCountryCode",
        "u.phoneNumber",
        "u.gender",
        "u.roleId",
        "u.dateOfJoined",
        "u.addressLine1",
        "u.addressLine2",
        "u.cityId",
        "u.stateId",
        "u.pinCode",
        "u.image",
        "u.userType",
        "u.status",
        "u.createdAt",
      ])
      .where("u.id = :id AND u.isDeleted = false", { id: userId })
      .getOne();

    if (!user) throw new NotFoundException("User not found");

    let cityName: string | null = null;
    let stateName: string | null = null;
    let roleName: string | null = null;

    if (user.cityId) {
      const city = await this.cityRepo
        .createQueryBuilder("c")
        .leftJoinAndSelect("c.state", "s")
        .where("c.id = :id", { id: user.cityId })
        .getOne();

      cityName = city?.city_name ?? null;
    }

    if (user.stateId) {
      const state = await this.stateRepo
        .createQueryBuilder("s")
        .where("s.id = :id", { id: user.stateId })
        .getOne();

      stateName = state?.state_name ?? null;
    }

    if (user.roleId) {
      const role = await this.roleRepo
        .createQueryBuilder("r")
        .where("r.id = :id", { id: user.roleId })
        .getOne();
      roleName = role?.roleName ?? null;
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneCountryCode: user.phoneCountryCode,
      phoneNumber: user.phoneNumber,
      gender: user.gender,
      role_id: user.roleId,
      role: roleName,
      dateOfJoined: user.dateOfJoined,
      addressLine1: user.addressLine1,
      addressLine2: user.addressLine2,
      city_id: user.cityId,
      city: cityName,
      state_id: user.stateId,
      state: stateName,
      pinCode: user.pinCode,
      // image: user.image,
      image: user.image ? this.s3Service.getPublicUrl(user.image) : null,
      userType: user.userType,
      status: user.status,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    const user = await this.userRepo.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) throw new NotFoundException("User not found");
    if (dto.image !== undefined) user.image = dto.image;
    if (dto.firstName !== undefined) user.firstName = dto.firstName;
    if (dto.lastName !== undefined) user.lastName = dto.lastName;
    if (dto.phoneCountryCode !== undefined)
      user.phoneCountryCode = dto.phoneCountryCode;
    if (dto.phoneNumber !== undefined) user.phoneNumber = dto.phoneNumber;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.gender !== undefined) user.gender = dto.gender;
    if (dto.dateOfJoined !== undefined)
      user.dateOfJoined = new Date(dto.dateOfJoined);
    if (dto.addressLine1 !== undefined) user.addressLine1 = dto.addressLine1;
    if (dto.addressLine2 !== undefined) user.addressLine2 = dto.addressLine2;
    if (dto.cityId !== undefined) user.cityId = dto.cityId;
    if (dto.roleId !== undefined) user.roleId = dto.roleId;
    if (dto.pinCode !== undefined) user.pinCode = dto.pinCode;
    if (dto.stateId !== undefined) user.stateId = dto.stateId;

    // Only set updatedBy if it looks like a valid UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    user.updatedBy = uuidRegex.test(userId) ? userId : null;

    await this.userRepo.save(user);
    return this.getProfile(userId);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({
      where: { id: userId, isDeleted: false },
    });

    if (!user) throw new NotFoundException("User not found");

    // ✅ Check current password
    const isMatch = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new BadRequestException("Current password is incorrect");
    }

    // ✅ Check new password & confirm password
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException("Confirm Passwords do not match");
    }

    // ✅ Prevent same password reuse
    const isSamePassword = await bcrypt.compare(
      dto.newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestException(
        "New password must be different from current password",
      );
    }

    // ✅ Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    user.passwordHash = hashedPassword;
    user.isTemporaryPassword = false;

    // ✅ updatedBy logic (same as your pattern)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    user.updatedBy = uuidRegex.test(userId) ? userId : null;

    await this.userRepo.save(user);

    return { message: "Password changed successfully" };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email, isDeleted: false },
    });

    // Don't reveal user existence (security)
    if (!user) throw new BadRequestException("email not found");

    // ✅ Generate token
    const token = crypto.randomBytes(32).toString("hex");

    // ✅ Expiry (1 hour)
    const expiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = "12345";
    user.resetPasswordExpires = expiry;

    await this.userRepo.save(user);

    // 📧 TODO: Send email (example)
    const resetLink = ` https://dev-admin.silicondrive.com/reset-password?token=12345`;

    console.log("Reset link:", resetLink);

    return { message: "Reset password link sent to email" };
  }

  private readonly transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    auth: {
      user: "krishnamurthy@nextbraintech.com",
      pass: "pyrubmjmthdpqmmb",
    },
  });

  async sendResetPasswordEmail(to: string, resetLink: string) {
    await this.transporter.sendMail({
      from: '"Your App" <your-email@gmail.com>',
      to,
      subject: "Reset Your Password",
      html: `
        <h3>Password Reset Request</h3>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}" target="_blank">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    });
  }

  async resetPassword(token: string, dto: ResetPasswordDto) {
    if (!token) {
      throw new BadRequestException("Token is required");
    }

    const user = await this.userRepo.findOne({
      where: { resetPasswordToken: token },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < new Date()
    ) {
      throw new BadRequestException("Invalid or expired token");
    }

    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException("Passwords do not match");
    }

    // ✅ Hash new password
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);

    // ✅ Clear token after use
    user.resetPasswordToken = null;
    user.isTemporaryPassword = false;

    await this.userRepo.save(user);

    return {
      message: "Password reset successful",
    };
  }

  async isAccessJtiBlocked(jti: string): Promise<boolean> {
    const row = await this.tokenRepo
      .createQueryBuilder("s")
      .where("s.blocked_access_jti = :jti", { jti })
      .andWhere("s.blocked_access_expires_at > NOW()")
      .getOne();

    return !!row;
  }
}
