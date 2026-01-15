import { useState } from 'react';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import ApplicationUnitLabel from '@/components/ApplicationUnitLabel';
import cn from '@/utils/cn';
import type { Track, ApplicationUnit } from '@/types/event';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
type ViewMode = 'grid' | 'ticket';

interface SlotExtraInfo {
  mentor?: string;
  location?: string;
  [key: string]: unknown;
}

interface MyReservation {
  id: number;
  userId: string;
  slotId: number;
  status: ReservationStatus;
  reservedAt: string;
  eventTitle: string;
  eventStartTime: string;
  eventEndTime: string;
  eventTrack: Track;
  applicationUnit: ApplicationUnit;
  extraInfo?: SlotExtraInfo;
}

const RESERVATION_STATUS_TEXT: Record<ReservationStatus | 'ENDED', string> = {
  CONFIRMED: '신청완료',
  PENDING: '대기중',
  CANCELLED: '취소됨',
  ENDED: '종료',
};

// TODO: 백엔드 API 연동
// GET /reservations API 응답에 eventTrack, applicationUnit, extraInfo 필드 추가 필요
const MOCK_RESERVATIONS: MyReservation[] = [];

function formatDateWithDay(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const dayNum = date.getDate();
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  return `${month}.${dayNum}. (${weekday})`;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function calcDDay(dateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff === 0) return 'D-Day';
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function isEventEnded(endTimeStr: string): boolean {
  return new Date(endTimeStr) < new Date();
}

function sortReservations(reservations: MyReservation[]): MyReservation[] {
  return [...reservations].sort((a, b) => {
    const aEnded = isEventEnded(a.eventEndTime);
    const bEnded = isEventEnded(b.eventEndTime);
    const aIsActive = a.status === 'CONFIRMED' && !aEnded;
    const bIsActive = b.status === 'CONFIRMED' && !bEnded;

    if (aIsActive && !bIsActive) return -1;
    if (!aIsActive && bIsActive) return 1;

    const aTime = new Date(a.eventStartTime).getTime();
    const bTime = new Date(b.eventStartTime).getTime();

    return aIsActive && bIsActive ? aTime - bTime : bTime - aTime;
  });
}

interface ReservationStatusBadgeProps {
  status: ReservationStatus;
  isEnded: boolean;
}

function ReservationStatusBadge({ status, isEnded }: ReservationStatusBadgeProps) {
  const displayStatus = isEnded && status === 'CONFIRMED' ? 'ENDED' : status;

  return (
    <span
      className={cn(
        'flex h-6 items-center rounded px-2 text-12 font-bold',
        displayStatus === 'CONFIRMED' && 'border border-brand-500 bg-brand-500 text-white',
        displayStatus === 'PENDING' && 'border border-brand-500 bg-white text-brand-500',
        displayStatus === 'CANCELLED' && 'border border-error-500 bg-white text-error-500',
        displayStatus === 'ENDED' && 'border border-gray-200 bg-gray-100 text-gray-500',
      )}
    >
      {RESERVATION_STATUS_TEXT[displayStatus]}
    </span>
  );
}

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

function ViewModeToggle({ mode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex h-9 items-center gap-1 rounded-lg bg-gray-50 p-1">
      {(['grid', 'ticket'] as const).map((m) => (
        <button
          type="button"
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            'rounded-md px-4 py-1.5 text-14 font-bold transition-all',
            mode === m
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:bg-gray-100',
          )}
        >
          {m === 'grid' ? '나의 예약 현황' : '다가오는 일정'}
        </button>
      ))}
    </div>
  );
}

interface FeaturedTicketProps {
  reservation: MyReservation;
}

function FeaturedTicket({ reservation }: FeaturedTicketProps) {
  const {
    eventTitle,
    eventStartTime,
    eventEndTime,
    eventTrack,
    applicationUnit,
    status,
    extraInfo,
  } = reservation;
  const isEnded = isEventEnded(eventEndTime);
  const mentor = extraInfo?.mentor;
  const location = extraInfo?.location;

  return (
    <div className="group flex cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative flex w-36 shrink-0 flex-col items-center justify-center overflow-hidden bg-brand-500 py-6 text-white">
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white opacity-10" />
        <span className="relative z-10 text-16 font-bold">
          {formatDateWithDay(eventStartTime)}
        </span>
        <span className="relative z-10 text-24 leading-tight font-extrabold">
          {calcDDay(eventStartTime)}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col bg-white">
        <div className="absolute top-1/2 -left-2.5 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full border-r border-gray-200 bg-white md:block" />

        <div className="flex flex-1 flex-col gap-2 p-6">
          <div className="flex items-center gap-1.5">
            <ApplicationUnitLabel applicationUnit={applicationUnit} />
            <EventCategoryLabel category={eventTrack} />
            <ReservationStatusBadge status={status} isEnded={isEnded} />
          </div>
          <h3 className="text-20 leading-tight font-bold text-gray-900 transition-colors group-hover:text-brand-500">
            {eventTitle}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 border-t border-gray-100 bg-[#F8FAFC] px-6 py-3">
          {mentor && (
            <div className="flex items-center text-14">
              <span className="mr-2 font-bold text-brand-500">멘토</span>
              <span className="text-gray-700">{mentor}</span>
            </div>
          )}
          {mentor && <div className="mx-3 hidden h-3 w-px bg-gray-200 sm:block" />}
          <div className="flex items-center text-14">
            <span className="mr-2 font-bold text-brand-500">시간</span>
            <span className="text-gray-700">
              {formatTime(eventStartTime)} ~ {formatTime(eventEndTime)}
            </span>
          </div>
          <div className="mx-3 hidden h-3 w-px bg-gray-200 sm:block" />
          {location && (
            <div className="flex items-center text-14">
              <span className="mr-2 font-bold text-brand-500">장소</span>
              <span className="max-w-40 truncate text-gray-700">{location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReservationTicketProps {
  reservation: MyReservation;
}

function ReservationTicket({ reservation }: ReservationTicketProps) {
  const {
    eventTitle,
    eventStartTime,
    eventEndTime,
    eventTrack,
    applicationUnit,
    status,
    extraInfo,
  } = reservation;
  const isEnded = isEventEnded(eventEndTime);
  const isActive = status === 'CONFIRMED' && !isEnded;
  const mentor = extraInfo?.mentor;
  const location = extraInfo?.location;

  return (
    <div className="group flex cursor-pointer overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-brand-500 hover:shadow-sm">
      <div className="relative flex w-32 shrink-0 flex-col items-center justify-center overflow-hidden bg-brand-50 p-4">
        <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-white opacity-50" />
        <span className="relative z-10 text-14 font-bold whitespace-nowrap text-brand-500">
          {formatDateWithDay(eventStartTime)}
        </span>
        {isActive && (
          <span className="relative z-10 mt-1 text-20 leading-none font-bold text-brand-500">
            {calcDDay(eventStartTime)}
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <div className="flex items-center gap-2">
            <ApplicationUnitLabel applicationUnit={applicationUnit} />
            <EventCategoryLabel category={eventTrack} />
            <ReservationStatusBadge status={status} isEnded={isEnded} />
          </div>
          <h3 className="truncate text-16 font-bold text-gray-900 transition-colors group-hover:text-brand-500">
            {eventTitle}
          </h3>
        </div>

        <div className="flex items-center gap-6 border-t border-gray-100 bg-[#F8FAFC] px-5 py-2.5">
          {mentor && (
            <div className="flex items-center text-12 text-gray-700">
              <span className="mr-2 font-bold text-brand-500">멘토</span>
              <span>{mentor}</span>
            </div>
          )}
          <div className="flex items-center text-12 text-gray-700">
            <span className="mr-2 font-bold text-brand-500">시간</span>
            <span>
              {formatTime(eventStartTime)} ~ {formatTime(eventEndTime)}
            </span>
          </div>
          {location && (
            <div className="flex items-center text-12 text-gray-700">
              <span className="mr-2 font-bold text-brand-500">장소</span>
              <span>{location}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CamperMyPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('ticket');
  const sortedReservations = sortReservations(MOCK_RESERVATIONS);
  const upcomingReservation = sortedReservations.find(
    (r) => r.status === 'CONFIRMED' && !isEventEnded(r.eventEndTime),
  );
  const listReservations = upcomingReservation
    ? sortedReservations.filter((r) => r.id !== upcomingReservation.id)
    : sortedReservations;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-36 font-extrabold text-gray-900">마이페이지</h1>
        <div className="flex items-center justify-between">
          <p className="text-16 text-gray-500">
            신청한 이벤트 내역을 확인하고 예약을 관리하세요.
          </p>
          <ViewModeToggle mode={viewMode} onChange={setViewMode} />
        </div>
        <hr className="border-t border-gray-200" />
      </div>

      {viewMode === 'ticket' && (
        <div className="flex flex-col gap-12">
          {upcomingReservation && (
            <section>
              <div className="mb-5 flex items-center gap-2">
                <span className="block h-6 w-1 rounded-full bg-brand-500" />
                <h2 className="text-24 font-extrabold text-gray-900">다가오는 일정</h2>
              </div>
              <FeaturedTicket reservation={upcomingReservation} />
            </section>
          )}

          <section>
            <h2 className="mb-5 text-20 font-bold text-gray-700">전체 예약 내역</h2>
            <div className="flex flex-col gap-3">
              {listReservations.map((reservation) => (
                <ReservationTicket key={reservation.id} reservation={reservation} />
              ))}
            </div>
          </section>
        </div>
      )}

      {viewMode === 'grid' && (
        <section>
          <h2 className="mb-5 text-24 font-extrabold text-gray-900">나의 예약 현황</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedReservations.map((reservation) => {
              const isEnded = isEventEnded(reservation.eventEndTime);
              return (
                <div
                  key={reservation.id}
                  className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  <div className="flex flex-1 flex-col gap-3 p-5">
                    <div className="flex items-center gap-2">
                      <ApplicationUnitLabel applicationUnit={reservation.applicationUnit} />
                      <EventCategoryLabel category={reservation.eventTrack} />
                      <ReservationStatusBadge status={reservation.status} isEnded={isEnded} />
                    </div>
                    <h3 className="text-16 leading-7 font-bold text-gray-900 transition-colors group-hover:text-brand-500">
                      {reservation.eventTitle}
                    </h3>
                  </div>
                  <div className="mt-auto flex flex-col gap-2 border-t border-gray-100 bg-brand-50 px-5 py-4">
                    {reservation.extraInfo?.mentor && (
                      <div className="flex items-center text-12 text-gray-700">
                        <span className="w-8 shrink-0 font-bold text-brand-500">멘토</span>
                        <span className="truncate">{reservation.extraInfo.mentor}</span>
                      </div>
                    )}
                    <div className="flex items-center text-12 text-gray-700">
                      <span className="w-8 shrink-0 font-bold text-brand-500">시간</span>
                      <span className="truncate">
                        {formatDateWithDay(reservation.eventStartTime)}
                      </span>
                    </div>
                    {reservation.extraInfo?.location && (
                      <div className="flex items-center text-12 text-gray-700">
                        <span className="w-8 shrink-0 font-bold text-brand-500">장소</span>
                        <span className="truncate">{reservation.extraInfo.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default CamperMyPage;
