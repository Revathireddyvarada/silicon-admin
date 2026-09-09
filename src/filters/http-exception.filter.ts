import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply } from 'fastify';          // ← add

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();  // ← typed

    let status  = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors  : { field: string | null; message: string }[] | undefined;

    if (exception instanceof HttpException) {
      status    = exception.getStatus();
      const res = exception.getResponse() as any;

      if (typeof res === 'string') {
        message = res;
      } else if (res && typeof res === 'object') {
        message = res.message || res.error || message;

        if (Array.isArray(res.message)) {
          errors = res.message.map((msg: string) => ({
            field  : null,
            message: msg,
          }));
        } else if (res.errors && Array.isArray(res.errors)) {
          message = res.message ?? 'Validation failed';
          errors  = res.errors.map((e: { field?: string; message?: string }) => ({
            field  : e.field   ?? null,
            message: e.message ?? 'Invalid',
          }));
        }
      }
    }

    const body: Record<string, unknown> = {  // ← typed instead of any
      success   : false,
      statusCode: status,
      message,
    };

    if (errors) body.errors = errors;

    if (status >= 500) {
      this.logger.error(
        `${status} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).send(body);  // ← same API in Fastify ✅
  }
}