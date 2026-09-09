import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FastifyRequest } from 'fastify';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserType } from '../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {

    // ── Skip @Public() routes ────────────────────────────
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    // ── No @Roles() = any authenticated user ─────────────
    const requiredRoles = this.reflector.getAllAndOverride<UserType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    // ── Fastify typed request ────────────────────────────
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const user = request.user;

    if (!user) throw new ForbiddenException('User not authenticated');

    if (!requiredRoles.includes(user.userType as UserType)) {
      // throw new ForbiddenException(`Access denied. Required: ${requiredRoles.join(', ')}`);
      throw new ForbiddenException(`Access denied.`);
    }
    return true;
  }
}