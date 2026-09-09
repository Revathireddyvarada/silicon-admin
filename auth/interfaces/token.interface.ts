export interface TokenInterface {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  revoked: boolean;
  revokedAt?: Date;
}
