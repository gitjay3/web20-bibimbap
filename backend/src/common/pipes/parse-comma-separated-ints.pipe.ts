import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

interface ParseCommaSeparatedIntsOptions {
  optional?: boolean;
}

/**
 * 콤마로 구분된 정수 문자열을 숫자 배열로 변환하는 Pipe
 * @example "1,2,3" → [1, 2, 3]
 */
@Injectable()
export class ParseCommaSeparatedIntsPipe implements PipeTransform<
  string | undefined,
  number[] | undefined
> {
  constructor(private readonly options?: ParseCommaSeparatedIntsOptions) {}

  transform(value: string | undefined): number[] | undefined {
    if (!value || value.trim() === '') {
      if (this.options?.optional) {
        return undefined;
      }
      throw new BadRequestException('값은 비어있을 수 없습니다.');
    }

    return value.split(',').map((id) => {
      const trimmed = id.trim();
      const parsed = parseInt(trimmed, 10);

      if (isNaN(parsed)) {
        throw new BadRequestException(`유효하지 않은 ID: ${trimmed}`);
      }

      return parsed;
    });
  }
}
