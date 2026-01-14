import { describe, it, expect } from 'vitest';
import formatKoreanDateTime from './formatKoreanDateTime';

describe('formatKoreanDateTime', () => {
  it('날짜를 한국어 형식으로 포맷한다', () => {
    const date = new Date('2024-03-15T14:30:00');
    const result = formatKoreanDateTime(date);

    // 월과 일이 포함되어야 함
    expect(result).toContain('3.');
    expect(result).toContain('15.');

    // 요일이 괄호 안에 포함되어야 함
    expect(result).toMatch(/\(.+\)/);

    // HH:MM 형식의 시간이 포함되어야 함
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('오전 시간을 올바르게 포맷한다', () => {
    const date = new Date('2024-01-01T09:05:00');
    const result = formatKoreanDateTime(date);

    expect(result).toContain('1.');
    expect(result).toContain('09:05');
  });

  it('자정을 올바르게 처리한다', () => {
    const date = new Date('2024-12-31T00:00:00');
    const result = formatKoreanDateTime(date);

    expect(result).toContain('12.');
    expect(result).toContain('31.');
    expect(result).toContain('00:00');
  });

  it('한 자리 월과 일을 올바르게 포맷한다', () => {
    const date = new Date('2024-05-07T10:00:00');
    const result = formatKoreanDateTime(date);

    expect(result).toContain('5.');
    expect(result).toContain('7.');
  });
});
