import type { EventSession } from '@/types/event';
import SessionCard from './SessionCard';

interface SessionListProps {
  sessions: EventSession[];
  selectedSessionId: string | null;
  onSelectSession: (id: string) => void;
}

function SessionList({ sessions, selectedSessionId, onSelectSession }: SessionListProps) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-20 font-bold">예약 옵션</h3>
      <div className="text-12 text-neutral-text-tertiary flex items-center gap-2">
        <span>강의 내용</span>
        <span>|</span>
        <span>시간</span>
        <span>|</span>
        <span>장소</span>
      </div>
      <div className="flex flex-col gap-2">
        {sessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            isSelected={selectedSessionId === session.id}
            onSelect={onSelectSession}
          />
        ))}
      </div>
    </div>
  );
}

export default SessionList;
