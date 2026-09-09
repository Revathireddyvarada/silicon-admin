import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

export interface CurrentUserPayload {
  id   : string;
  email: string;
  userType : number;
  jti  : string;    // ← token ID — matches guard
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest>();
    return request.user as CurrentUserPayload;
  },
);