import { describe, it, expect } from 'vitest';
import cn from './cn';

describe('cn', () => {
  it('단일 클래스 이름을 반환한다', () => {
    expect(cn('foo')).toBe('foo');
  });

  it('여러 클래스 이름을 병합한다', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('조건부 클래스를 처리한다', () => {
    expect(cn('base', true && 'active', false && 'hidden')).toBe('base active');
  });

  it('undefined와 null 값을 무시한다', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });

  it('충돌하는 Tailwind 클래스를 병합한다 (tailwind-merge)', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });

  it('배열 입력을 처리한다', () => {
    expect(cn(['foo', 'bar'])).toBe('foo bar');
  });

  it('객체 입력을 처리한다', () => {
    expect(cn({ active: true, disabled: false })).toBe('active');
  });

  it('빈 입력을 처리한다', () => {
    expect(cn()).toBe('');
    expect(cn('')).toBe('');
  });
});
