import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { EventStatus } from '@/types/event';
import EventStatusLabel from './EventStatusLabel';

describe('EventStatusLabel', () => {
  it('ONGOING 상태를 올바르게 렌더링한다', () => {
    render(<EventStatusLabel status="ONGOING" />);

    expect(screen.getByText('진행중')).toBeInTheDocument();
  });

  it('UPCOMING 상태를 올바르게 렌더링한다', () => {
    render(<EventStatusLabel status="UPCOMING" />);

    expect(screen.getByText('예정')).toBeInTheDocument();
  });

  it('ENDED 상태를 올바르게 렌더링한다', () => {
    render(<EventStatusLabel status="ENDED" />);

    expect(screen.getByText('종료')).toBeInTheDocument();
  });

  it.each<[EventStatus, string]>([
    ['ONGOING', '진행중'],
    ['UPCOMING', '예정'],
    ['ENDED', '종료'],
  ])('상태 %s에 대해 올바른 라벨 %s를 표시한다', (status, expectedText) => {
    render(<EventStatusLabel status={status} />);

    expect(screen.getByText(expectedText)).toBeInTheDocument();
  });
});
