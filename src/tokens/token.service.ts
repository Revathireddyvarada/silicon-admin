import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { normalizePemKey } from '../utils/pem-key.util';

export interface AccessTokenResult {
  access_token : string;
  jti          : string;
  expires_in   : number;
  expiry_date  : string;
}

export interface RefreshTokenResult {
  refresh_token      : string;
  refresh_jti        : string;
  refresh_expires_at : Date;
}

@Injectable()
export class TokenService implements OnModuleInit {
  private readonly logger = new Logger(TokenService.name);
  private privateKey!: string;
  private publicKey! : string;
  private issuer!    : string;
  private audience!  : string;
  private accessTtl! : number;
  private refreshTtl!: number;

  constructor(private readonly config: ConfigService) {}

  // ✅ runs after DI is fully ready — guaranteed ConfigService is injected
  onModuleInit(): void {
    this.privateKey = normalizePemKey(
      this.config.getOrThrow<string>('JWT_PRIVATE_KEY'),
    );
    this.publicKey = normalizePemKey(
      this.config.getOrThrow<string>('JWT_PUBLIC_KEY'),
    );
    this.issuer     = this.config.getOrThrow<string>('JWT_ISSUER');
    this.audience   = this.config.getOrThrow<string>('JWT_AUDIENCE');
    this.accessTtl  = this.config.get<number>('JWT_ACCESS_TTL',  15 * 60);
    this.refreshTtl = this.config.get<number>('JWT_REFRESH_TTL', 7 * 24 * 3600);
    this.logger.log('TokenService initialized');
  }

  generateAccessToken(userId: string, userType: number, email: string): AccessTokenResult {
    const jti        = randomUUID();
    const now        = Math.floor(Date.now() / 1000);
    const exp        = now + this.accessTtl;
    const expiryDate = new Date(exp * 1000).toISOString();

    const access_token = jwt.sign(
      { sub: userId, userType, email, jti },
      this.privateKey,
      {
        algorithm : 'RS256',
        issuer    : this.issuer,
        audience  : this.audience,
        expiresIn : this.accessTtl,
      },
    );

    return { access_token, jti, expires_in: this.accessTtl, expiry_date: expiryDate };
  }

  generateRefreshToken(userId: string): RefreshTokenResult {
    const refresh_jti        = randomUUID();
    const refresh_expires_at = new Date(Date.now() + this.refreshTtl * 1000);

    const refresh_token = jwt.sign(
      { sub: userId, jti: refresh_jti, type: 'refresh' },
      this.privateKey,
      {
        algorithm : 'RS256',
        issuer    : this.issuer,
        audience  : this.audience,
        expiresIn : this.refreshTtl,
      },
    );

    return { refresh_token, refresh_jti, refresh_expires_at };
  }

  verify(token: string): jwt.JwtPayload {
    try {
      return jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer    : this.issuer,
        audience  : this.audience,
      }) as jwt.JwtPayload;
    } catch (err) {
      throw err;
    }
  }
}
