import { HttpException, HttpStatus } from '@nestjs/common';

// 기본 API 예외 클래스
export class ApiException extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  ) {
    super({ statusCode, message, error: HttpStatus[statusCode] }, statusCode);
  }
}

// TODO : 예외 리스트 필요시 추가
export class SlotFullException extends ApiException {
  constructor() {
    super('정원이 마감되었습니다', HttpStatus.BAD_REQUEST);
  }
}

export class DuplicateReservationException extends ApiException {
  constructor() {
    super('이미 예약한 일정입니다', HttpStatus.BAD_REQUEST);
  }
}

export class ReservationNotFoundException extends ApiException {
  constructor() {
    super('예약을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
  }
}

export class UnauthorizedReservationException extends ApiException {
  constructor() {
    super('본인의 예약만 취소할 수 있습니다', HttpStatus.FORBIDDEN);
  }
}

export class AlreadyCancelledException extends ApiException {
  constructor() {
    super('이미 취소된 예약입니다', HttpStatus.BAD_REQUEST);
  }
}
