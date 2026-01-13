import { useState } from 'react';
import { useParams } from 'react-router';
import type { EventDetail as EventDetailType } from '@/types/event';
import EventDetailHeader from './components/EventDetailHeader';
import SessionList from './components/SessionList';
import ReservationButton from './components/ReservationButton';
import ReservationDisabled from './components/ReservationDisabled';

const mockEventDetails: Record<number, EventDetailType> = {
  1: {
    id: 1,
    category: 'WEB',
    status: 'ONGOING',
    title: '1주차: 웹 풀스택 과정 멘토링',
    description:
      'React와 Node.js를 활용한 웹 풀스택 개발 기초를 다지는 시간입니다. 멘토님과 함께 코드 리뷰 및 아키텍처 설계를 진행합니다.',
    startAt: new Date('2026-01-15T14:00:00'),
    endAt: new Date('2026-01-15T18:00:00'),
    applicationUnit: 'INDIVIDUAL',
    sessions: [
      { id: 'session-1-1', content: 'A팀 멘토링', startTime: '14:00', endTime: '15:00', location: 'Zoom', currentCount: 5, maxCount: 5, isClosed: true },
      { id: 'session-1-2', content: 'B팀 멘토링', startTime: '15:00', endTime: '16:00', location: 'Zoom', currentCount: 3, maxCount: 5, isClosed: false },
      { id: 'session-1-3', content: 'C팀 멘토링', startTime: '16:00', endTime: '17:00', location: 'Zoom', currentCount: 1, maxCount: 5, isClosed: false },
      { id: 'session-1-4', content: 'D팀 멘토링', startTime: '17:00', endTime: '18:00', location: 'Zoom', currentCount: 2, maxCount: 5, isClosed: false },
    ],
  },
  2: {
    id: 2,
    category: 'ANDROID',
    status: 'ONGOING',
    title: '1주차: Android 코틀린 심화',
    description:
      '코틀린 코루틴과 비동기 처리에 대해 심도 있게 학습합니다. 실무에서 자주 발생하는 이슈를 중심으로 다룹니다.',
    startAt: new Date('2026-01-22T10:00:00'),
    endAt: new Date('2026-01-22T12:00:00'),
    applicationUnit: 'TEAM',
    sessions: [
      { id: 'session-2-1', content: '코루틴 기초', startTime: '10:00', endTime: '10:30', location: '강남 캠퍼스 301호', currentCount: 4, maxCount: 6, isClosed: false },
      { id: 'session-2-2', content: '비동기 처리 실습', startTime: '10:30', endTime: '11:00', location: '강남 캠퍼스 301호', currentCount: 6, maxCount: 6, isClosed: true },
      { id: 'session-2-3', content: 'Q&A 세션', startTime: '11:00', endTime: '12:00', location: '강남 캠퍼스 301호', currentCount: 2, maxCount: 6, isClosed: false },
    ],
  },
  3: {
    id: 3,
    category: 'IOS',
    status: 'ONGOING',
    title: '1주차: iOS 오토레이아웃 마스터',
    description:
      '복잡한 UI도 쉽게 구현할 수 있는 오토레이아웃 비법을 전수합니다. 다양한 해상도 대응 전략을 다룹니다.',
    startAt: new Date('2026-01-28T13:00:00'),
    endAt: new Date('2026-01-28T16:00:00'),
    applicationUnit: 'TEAM',
    sessions: [
      { id: 'session-3-1', content: '오토레이아웃 기초', startTime: '13:00', endTime: '14:00', location: 'Zoom', currentCount: 3, maxCount: 4, isClosed: false },
      { id: 'session-3-2', content: '스택뷰 활용', startTime: '14:00', endTime: '15:00', location: 'Zoom', currentCount: 4, maxCount: 4, isClosed: true },
      { id: 'session-3-3', content: '다양한 해상도 대응', startTime: '15:00', endTime: '16:00', location: 'Zoom', currentCount: 1, maxCount: 4, isClosed: false },
    ],
  },
  4: {
    id: 4,
    category: 'ANDROID',
    status: 'UPCOMING',
    title: '2주차: Android 아키텍처 패턴',
    description: 'MVVM, Clean Architecture를 중심으로 안드로이드 앱 구조 설계 방법을 학습합니다.',
    startAt: new Date('2026-02-05T10:00:00'),
    endAt: new Date('2026-02-05T12:00:00'),
    applicationUnit: 'INDIVIDUAL',
    sessions: [
      { id: 'session-4-1', content: 'MVVM 패턴 이해', startTime: '10:00', endTime: '10:40', location: '강남 캠퍼스 302호', currentCount: 0, maxCount: 8, isClosed: false },
      { id: 'session-4-2', content: 'Clean Architecture 실습', startTime: '10:40', endTime: '11:20', location: '강남 캠퍼스 302호', currentCount: 0, maxCount: 8, isClosed: false },
      { id: 'session-4-3', content: '코드 리뷰', startTime: '11:20', endTime: '12:00', location: '강남 캠퍼스 302호', currentCount: 0, maxCount: 8, isClosed: false },
    ],
  },
  5: {
    id: 5,
    category: 'ANDROID',
    status: 'ENDED',
    title: '0주차: Android 개발 환경 세팅',
    description: '안드로이드 개발을 위한 기본 환경 세팅과 필수 도구 사용법을 안내합니다.',
    startAt: new Date('2026-01-08T10:00:00'),
    endAt: new Date('2026-01-08T12:00:00'),
    applicationUnit: 'INDIVIDUAL',
    sessions: [
      { id: 'session-5-1', content: 'Android Studio 설치', startTime: '10:00', endTime: '10:30', location: 'Zoom', currentCount: 10, maxCount: 10, isClosed: true },
      { id: 'session-5-2', content: 'SDK 설정', startTime: '10:30', endTime: '11:00', location: 'Zoom', currentCount: 10, maxCount: 10, isClosed: true },
      { id: 'session-5-3', content: '에뮬레이터 구성', startTime: '11:00', endTime: '12:00', location: 'Zoom', currentCount: 10, maxCount: 10, isClosed: true },
    ],
  },
};

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const eventDetail = mockEventDetails[Number(id)];

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleReservation = () => {
    if (selectedSessionId) {
      // TODO: 예약 API 호출
      console.log('예약 요청:', selectedSessionId);
    }
  };

  if (!eventDetail) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-neutral-text-secondary">이벤트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="flex flex-col gap-8 pb-24 pt-8">
          <EventDetailHeader
            category={eventDetail.category}
            status={eventDetail.status}
            title={eventDetail.title}
            description={eventDetail.description}
            applicationUnit={eventDetail.applicationUnit}
          />
          <hr className="border-neutral-border-default" />
          <SessionList
            sessions={eventDetail.sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
        </div>
      </div>
      {eventDetail.status === 'ONGOING' ? (
        <ReservationButton disabled={selectedSessionId === null} onClick={handleReservation} />
      ) : (
        <ReservationDisabled />
      )}
    </div>
  );
}

export default EventDetail;
