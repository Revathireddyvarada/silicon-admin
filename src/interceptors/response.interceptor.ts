import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

function isHealthPath(url: string | undefined): boolean {
  const path = (url ?? '').split('?')[0].replace(/\/+$/, '') || '/';
  return path === '/health' || path === '/api/health' || path.endsWith('/health');
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T> {
  private readonly logger = new Logger(ResponseInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<FastifyRequest>();
    const res = http.getResponse<FastifyReply>();
    const method = req.method;
    const url = req.url;

    // Keep /health body as-is so probes stay simple; do not wrap other APIs.
    // Skip CSV/stream downloads — they use @Res() and must not be JSON-wrapped.
    const path = (url ?? "").split("?")[0];
    if (
      isHealthPath(url) ||
      path.includes("/download/csv") ||
      path.includes("/export/csv") ||
      path.endsWith("/download")
    ) {
      return next.handle();
    }

    const started = Date.now();

    return next.handle().pipe(
      map((data: unknown) => {
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'statusCode' in data &&
          'message' in data
        ) {
          return data;
        }

        return {
          success: true,
          statusCode: res.statusCode ?? 200,
          message: 'Request successful',
          data,
        };
      }),
      tap((wrapped: any) => {
        const duration = Date.now() - started;
        const status = wrapped?.statusCode ?? res.statusCode ?? 200;
        // Never JSON.stringify full list payloads — that alone makes map/list APIs slow.
        const isLargeListPath =
          path.includes("/location-details") ||
          path.includes("/drivers/cursor") ||
          path.endsWith("/drivers");
        const bodySummary = isLargeListPath
          ? `count=${
              Array.isArray(wrapped?.data?.data)
                ? wrapped.data.data.length
                : Array.isArray(wrapped?.data)
                  ? wrapped.data.length
                  : "?"
            }`
          : `body=${JSON.stringify(wrapped)}`;
        this.logger.log(
          `[Response] ${method} ${url} -> ${status} in ${duration}ms ${bodySummary}`,
        );
      }),
    );
  }
}
