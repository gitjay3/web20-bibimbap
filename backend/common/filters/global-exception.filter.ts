import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '서버 내부 오류가 발생했습니다';
    let error = 'Internal Server Error';

    // 1. NestJS HttpException (BadRequestException, NotFoundException 등 포함)
    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as Record<string, unknown>;
        // class-validator 에러 (배열일 수 있음)
        message = Array.isArray(res.message)
          ? res.message[0]
          : (res.message as string) || message;
        error = (res.error as string) || HttpStatus[statusCode];
      }
      error = HttpStatus[statusCode] || error;
    }

    // 2. Prisma 에러
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(
        `Prisma Error [${exception.code}]: ${exception.message}`,
      );
      switch (exception.code) {
        case 'P2002': // Unique constraint
          statusCode = HttpStatus.CONFLICT;
          message = '이미 존재하는 데이터입니다';
          error = 'Conflict';
          break;
        case 'P2025': // Record not found
          statusCode = HttpStatus.NOT_FOUND;
          message = '데이터를 찾을 수 없습니다';
          error = 'Not Found';
          break;
        default:
          statusCode = HttpStatus.BAD_REQUEST;
          message = '데이터베이스 오류가 발생했습니다';
          error = 'Bad Request';
      }
    }

    // 3. 기타 에러 로깅
    else {
      const errorMessage =
        exception instanceof Error ? exception.message : String(exception);
      const errorStack =
        exception instanceof Error ? exception.stack : undefined;
      this.logger.error(`Unhandled Exception: ${errorMessage}`, errorStack);
    }

    // 개발 환경에서 모든 에러 로깅
    if (process.env.NODE_ENV !== 'production') {
      this.logger.warn(`[${statusCode}] ${message}`);
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error,
    });
  }
}
