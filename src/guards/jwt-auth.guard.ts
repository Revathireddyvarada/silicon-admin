import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector, ModuleRef } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FastifyRequest } from 'fastify';
import * as jwt from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { normalizePemKey } from '../utils/pem-key.util';

interface JwtPayload {
  jti: string;
  sub: string;
  userType: number;
  email: string;
  exp: number;
  iat: number;

}

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      userType: number;
      jti: string;
      exp: number;
      serviceType: string;
    };
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  // ✅ lazy — not set in constructor
  private publicKey!: string;
  private issuer!: string;
  private audience!: string;

  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfigService,
    private readonly moduleRef: ModuleRef,
  ) { }

  // ✅ reads config on first request, not at bootstrap
  private initConfig(): void {
    if (this.publicKey) return;
    this.publicKey = normalizePemKey(this.config.getOrThrow('JWT_PUBLIC_KEY'));
    this.issuer = this.config.getOrThrow('JWT_ISSUER');
    this.audience = this.config.getOrThrow('JWT_AUDIENCE');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.initConfig();  // ← lazy init

    // ── Step 1: Skip @Public() ─────────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // ── Step 2: Extract token ──────────────────────────
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);
    if (!token) throw new UnauthorizedException('No token provided');

    // ── Step 3: Verify RS256 signature ─────────────────
    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: this.issuer,
        audience: this.audience,
      }) as JwtPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError)
        throw new UnauthorizedException('Token has expired');
      if (err instanceof jwt.NotBeforeError)
        throw new UnauthorizedException('Token not yet valid');
      throw new UnauthorizedException('Invalid token');
    }

    // ── Step 4: Blocklist check ────────────────────────
    const { AuthService } = await import('../auth/auth.service');
    const authService = this.moduleRef.get(AuthService, { strict: false }); // ← get not resolve
    const isBlocked = await authService.isAccessJtiBlocked(payload.jti);
    if (isBlocked) throw new UnauthorizedException('Token has been revoked');

    // ── Step 5: Attach user ────────────────────────────
    request.user = {
      id: payload.sub,
      email: payload.email,
      userType: payload.userType,
      jti: payload.jti,
      exp: payload.exp,
      serviceType: "admin-service"
    };

    return true;
  }

  private extractToken(request: FastifyRequest): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader) return null;
    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}