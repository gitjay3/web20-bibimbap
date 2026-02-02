import { Controller, Post, Body, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { ClientLogDto } from './dto/client-log.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('client-logs')
@Controller('logs')
export class ClientLogsController {
  constructor(
    @InjectPinoLogger(ClientLogsController.name)
    private readonly logger: PinoLogger,
  ) {}

  @Post('client')
  @Public()
  @ApiOperation({ summary: '프론트엔드 에러 로그 수집' })
  logClientError(
    @Body() dto: ClientLogDto,
    @Ip() ip: string,
    @Headers('x-forwarded-for') forwardedFor?: string,
  ): { success: boolean } {
    const clientIp = forwardedFor || ip || 'unknown';

    this.logger.error(
      {
        source: 'frontend',
        clientIp,
        ...dto,
      },
      `[Frontend Error] ${dto.message}`,
    );

    return { success: true };
  }
}
