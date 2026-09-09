import { UserType, UserStatus } from '../../entities/user.entity';

export type UserTypeType = UserType;
export type UserStatusType = UserStatus;

export interface UserDb {
  id: string;
  publicId: string;
  firstName: string;
  lastName: string | null;
  email: string;
  countryCode: string | null;
  phoneNumber: string;
  roleId: string | null;
  gender: number | null;
  dateOfJoined: Date | null;
  addressLine1: string | null;
  addressLine2: string | null;
  cityId: string | null;
  pinCode: string | null;
  image: string | null;
  userType: UserType;
  lastLoginAt: Date | null;
  status: UserStatus;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}
