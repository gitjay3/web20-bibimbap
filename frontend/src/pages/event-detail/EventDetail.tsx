import { useState } from 'react';
import { useParams } from 'react-router';
import type { EventDetail as EventDetailType } from '@/types/event';
import EventDetailHeader from './components/EventDetailHeader';
import SessionList from './components/SessionList';
import ReservationButton from './components/ReservationButton';

const mockEventDetail: EventDetailType = {
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
    {
      id: 'session-1',
      content: 'A팀 멘토링',
      startTime: '14:00',
      endTime: '15:00',
      location: 'Zoom',
      currentCount: 5,
      maxCount: 5,
      isClosed: true,
    },
    {
      id: 'session-2',
      content: 'B팀 멘토링',
      startTime: '15:00',
      endTime: '16:00',
      location: 'Zoom',
      currentCount: 3,
      maxCount: 5,
      isClosed: false,
    },
    {
      id: 'session-3',
      content: 'C팀 멘토링',
      startTime: '16:00',
      endTime: '17:00',
      location: 'Zoom',
      currentCount: 1,
      maxCount: 5,
      isClosed: false,
    },
    {
      id: 'session-4',
      content: 'D팀 멘토링',
      startTime: '17:00',
      endTime: '18:00',
      location: 'Zoom',
      currentCount: 2,
      maxCount: 5,
      isClosed: false,
    },
    {
      id: 'session-5',
      content: 'E팀 멘토링',
      startTime: '18:00',
      endTime: '19:00',
      location: 'Zoom',
      currentCount: 4,
      maxCount: 5,
      isClosed: false,
    },
    {
      id: 'session-6',
      content: 'F팀 멘토링',
      startTime: '19:00',
      endTime: '20:00',
      location: 'Zoom',
      currentCount: 5,
      maxCount: 5,
      isClosed: true,
    },
    {
      id: 'session-7',
      content: 'G팀 멘토링',
      startTime: '20:00',
      endTime: '21:00',
      location: 'Zoom',
      currentCount: 0,
      maxCount: 5,
      isClosed: false,
    },
    {
      id: 'session-8',
      content: 'H팀 멘토링',
      startTime: '21:00',
      endTime: '22:00',
      location: 'Zoom',
      currentCount: 3,
      maxCount: 5,
      isClosed: false,
    },
  ],
};

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  // TODO: API 연동 시 id를 사용하여 데이터 fetch
  console.log('Event ID:', id);

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
  };

  const handleReservation = () => {
    if (selectedSessionId) {
      // TODO: 예약 API 호출
      console.log('예약 요청:', selectedSessionId);
    }
  };

  return (
    <div>
      <div className="mx-auto w-full max-w-3xl px-4">
        <div className="flex flex-col gap-8 pb-24 pt-8">
          <EventDetailHeader
            category={mockEventDetail.category}
            status={mockEventDetail.status}
            title={mockEventDetail.title}
            description={mockEventDetail.description}
          />
          <hr className="border-neutral-border-default" />
          <SessionList
            sessions={mockEventDetail.sessions}
            selectedSessionId={selectedSessionId}
            onSelectSession={handleSelectSession}
          />
        </div>
      </div>
      <ReservationButton disabled={selectedSessionId === null} onClick={handleReservation} />
    </div>
  );
}

export default EventDetail;
