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

export class ReservationPeriodException extends ApiException {
  constructor() {
    super('예약 가능한 기간이 아닙니다', HttpStatus.BAD_REQUEST);
  }
}

export class ForbiddenOrganizationException extends ApiException {
  constructor() {
    super('이벤트 참여 권한이 없습니다', HttpStatus.FORBIDDEN);
  }
}

export class ForbiddenTrackException extends ApiException {
  constructor() {
    super('이벤트 트랙 조건에 맞지 않습니다', HttpStatus.FORBIDDEN);
  }
}

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
export class OptimisticLockException extends ApiException {
  constructor() {
    super(
      '다른 요청과 충돌이 발생했습니다. 다시 시도해주세요.',
      HttpStatus.CONFLICT,
    );
  }
}
export class SlotNotFoundException extends ApiException {
  constructor() {
    super('슬롯을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
  }
}

export class TeamRequiredException extends ApiException {
  constructor() {
    super(
      '팀 단위 예약입니다. 그룹에 배정된 사용자만 신청할 수 있습니다.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TeamMemberIneligibleException extends ApiException {
  constructor() {
    super(
      '팀원 중 예약 조건을 충족하지 못한 멤버가 있습니다.',
      HttpStatus.FORBIDDEN,
    );
  }
}

export class TeamAlreadyReservedException extends ApiException {
  constructor() {
    super('이미 팀원이 예약한 일정입니다.', HttpStatus.BAD_REQUEST);
  }
}
