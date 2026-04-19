import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === 'production';

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (!(exception instanceof HttpException)) {
      this.logger.error(`${req.method} ${req.url}`, exception instanceof Error ? exception.stack : undefined);
    }

    const message =
      exception instanceof HttpException
        ? (typeof exception.getResponse() === 'string'
            ? exception.getResponse()
            : (exception.getResponse() as { message?: string }).message) || exception.message
        : 'Internal Server Error';

    const body: Record<string, unknown> = {
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
    };

    if (!isProd && exception instanceof Error) {
      body.error = exception.name;
      body.detail = exception.message;
    }

    res.status(status).json(body);
  }
}
