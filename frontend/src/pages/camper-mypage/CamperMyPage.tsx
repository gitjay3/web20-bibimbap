import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import ApplicationUnitLabel from '@/components/ApplicationUnitLabel';
import Modal from '@/components/Modal';
import cn from '@/utils/cn';
import type { Track, ApplicationUnit } from '@/types/event';
import { getMyReservations, cancelReservation } from '@/api/reservation';
import type { ReservationApiResponse } from '@/types/BEapi';

type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
type ViewMode = 'grid' | 'ticket';

interface SlotExtraInfo {
  content?: string;
  eventDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  mentor?: string;
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

const EXTRA_INFO_LABELS: Record<string, string> = {
  content: '내용',
  eventDate: '날짜',
  startTime: '시작',
  endTime: '종료',
  location: '장소',
  mentorName: '멘토',
};

const EXTRA_INFO_ORDER = ['content', 'eventDate', 'startTime', 'endTime', 'location', 'mentorName'];

function getOrderedExtraInfo(extraInfo?: SlotExtraInfo): [string, unknown][] {
  if (!extraInfo) return [];
  return EXTRA_INFO_ORDER.filter((key) => key in extraInfo).map((key) => [key, extraInfo[key]]);
}

function mapApiResponseToMyReservation(res: ReservationApiResponse): MyReservation {
  return {
    id: res.id,
    userId: res.userId,
    slotId: res.slotId,
    status: res.status,
    reservedAt: res.reservedAt,
    eventTitle: res.eventTitle ?? '',
    eventStartTime: res.eventStartTime ?? '',
    eventEndTime: res.eventEndTime ?? '',
    eventTrack: (res.eventTrack ?? 'COMMON') as Track,
    applicationUnit: (res.applicationUnit ?? 'INDIVIDUAL') as ApplicationUnit,
    extraInfo: res.extraInfo,
  };
}

function formatDateWithDay(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const dayNum = date.getDate();
  const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' });
  return `${month}.${dayNum}. (${weekday})`;
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

function isCancellable(reservation: MyReservation): boolean {
  const { status, eventEndTime } = reservation;
  return (status === 'CONFIRMED' || status === 'PENDING') && !isEventEnded(eventEndTime);
}

interface CancelConfirmModalProps {
  isOpen: boolean;
  reservation: MyReservation | null;
  isSubmitting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

function CancelConfirmModal({
  isOpen,
  reservation,
  isSubmitting,
  onConfirm,
  onClose,
}: CancelConfirmModalProps) {
  if (!reservation) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-20 font-bold text-gray-900">예약을 취소하시겠습니까?</h2>
          <p className="text-14 text-gray-500">
            <span className="font-bold text-gray-700">{reservation.eventTitle}</span> 예약이
            취소됩니다.
          </p>
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-14 font-bold text-gray-700 transition hover:bg-gray-50"
          >
            닫기
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-lg bg-error-500 px-4 py-2 text-14 font-bold text-white transition hover:bg-error-600 disabled:opacity-50"
          >
            {isSubmitting ? '취소 중...' : '예약 취소'}
          </button>
        </div>
      </div>
    </Modal>
  );
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
            mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:bg-gray-100',
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
  onCancelClick: (reservation: MyReservation) => void;
}

function FeaturedTicket({ reservation, onCancelClick }: FeaturedTicketProps) {
  const { eventTitle, eventEndTime, eventTrack, applicationUnit, status, extraInfo } = reservation;
  const isEnded = isEventEnded(eventEndTime);
  const canCancel = isCancellable(reservation);
  const extraInfoEntries = getOrderedExtraInfo(extraInfo);
  const eventDate = extraInfo?.eventDate;

  return (
    <div className="group flex overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative flex w-36 shrink-0 flex-col items-center justify-center overflow-hidden bg-brand-500 py-6 text-white">
        <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white opacity-10" />
        <span className="relative z-10 text-16 font-bold">
          {eventDate ? formatDateWithDay(eventDate) : '-'}
        </span>
        <span className="relative z-10 text-24 leading-tight font-extrabold">
          {eventDate ? calcDDay(eventDate) : '-'}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col bg-white">
        <div className="absolute top-1/2 -left-2.5 z-10 hidden h-5 w-5 -translate-y-1/2 rounded-full border-r border-gray-200 bg-white md:block" />

        <div className="flex flex-1 flex-col gap-2 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ApplicationUnitLabel applicationUnit={applicationUnit} />
              <EventCategoryLabel category={eventTrack} />
              <ReservationStatusBadge status={status} isEnded={isEnded} />
            </div>
            {canCancel && (
              <button
                type="button"
                onClick={() => onCancelClick(reservation)}
                className="rounded-lg border border-error-500 bg-white px-3 py-1.5 text-12 font-bold text-error-500 transition hover:bg-error-50"
              >
                취소
              </button>
            )}
          </div>
          <h3 className="text-20 leading-tight font-bold text-gray-900">{eventTitle}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 border-t border-gray-100 bg-[#F8FAFC] px-6 py-3">
          {extraInfoEntries.map(([key, value], idx) => (
            <div key={key} className="flex items-center">
              <div className="flex items-center text-14">
                <span className="mr-2 font-bold text-brand-500">
                  {EXTRA_INFO_LABELS[key] ?? key}
                </span>
                <span className="max-w-40 truncate text-gray-700">{String(value)}</span>
              </div>
              {idx < extraInfoEntries.length - 1 && (
                <div className="mx-3 hidden h-3 w-px bg-gray-200 sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ReservationTicketProps {
  reservation: MyReservation;
  onCancelClick: (reservation: MyReservation) => void;
}

function ReservationTicket({ reservation, onCancelClick }: ReservationTicketProps) {
  const { eventTitle, eventEndTime, eventTrack, applicationUnit, status, extraInfo } = reservation;
  const isEnded = isEventEnded(eventEndTime);
  const isActive = status === 'CONFIRMED' && !isEnded;
  const canCancel = isCancellable(reservation);
  const extraInfoEntries = getOrderedExtraInfo(extraInfo);
  const eventDate = extraInfo?.eventDate;

  return (
    <div className="group flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-brand-500 hover:shadow-sm">
      <div className="relative flex w-32 shrink-0 flex-col items-center justify-center overflow-hidden bg-brand-50 p-4">
        <div className="absolute -top-6 -right-6 h-16 w-16 rounded-full bg-white opacity-50" />
        <span className="relative z-10 text-14 font-bold whitespace-nowrap text-brand-500">
          {eventDate ? formatDateWithDay(eventDate) : '-'}
        </span>
        {isActive && eventDate && (
          <span className="relative z-10 mt-1 text-20 leading-none font-bold text-brand-500">
            {calcDDay(eventDate)}
          </span>
        )}
      </div>

      <div className="relative flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ApplicationUnitLabel applicationUnit={applicationUnit} />
              <EventCategoryLabel category={eventTrack} />
              <ReservationStatusBadge status={status} isEnded={isEnded} />
            </div>
            {canCancel && (
              <button
                type="button"
                onClick={() => onCancelClick(reservation)}
                className="rounded-lg border border-error-500 bg-white px-3 py-1.5 text-12 font-bold text-error-500 transition hover:bg-error-50"
              >
                취소
              </button>
            )}
          </div>
          <h3 className="truncate text-16 font-bold text-gray-900">{eventTitle}</h3>
        </div>

        <div className="flex items-center gap-6 border-t border-gray-100 bg-[#F8FAFC] px-5 py-2.5">
          {extraInfoEntries.map(([key, value]) => (
            <div key={key} className="flex items-center text-12 text-gray-700">
              <span className="mr-2 font-bold text-brand-500">
                {EXTRA_INFO_LABELS[key] ?? key}
              </span>
              <span>{String(value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CamperMyPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('ticket');
  const [reservations, setReservations] = useState<MyReservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<MyReservation | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    async function fetchReservations() {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getMyReservations();
        setReservations(data.map(mapApiResponseToMyReservation));
      } catch (err) {
        setError('예약 목록을 불러오는데 실패했습니다.');
        console.error('Failed to fetch reservations:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReservations();
  }, []);

  const handleCancelClick = (reservation: MyReservation) => {
    setCancelTarget(reservation);
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;

    setIsCancelling(true);
    try {
      await cancelReservation(cancelTarget.id);
      toast.success('예약이 취소되었습니다.');
      setReservations((prev) =>
        prev.map((r) =>
          r.id === cancelTarget.id ? { ...r, status: 'CANCELLED' as ReservationStatus } : r,
        ),
      );
      setCancelTarget(null);
    } catch (err) {
      console.error('예약 취소 실패:', err);
      toast.error('예약 취소에 실패했습니다.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelClose = () => {
    if (!isCancelling) {
      setCancelTarget(null);
    }
  };

  const sortedReservations = sortReservations(reservations);
  const upcomingReservation = sortedReservations.find(
    (r) => r.status === 'CONFIRMED' && !isEventEnded(r.eventEndTime),
  );
  const listReservations = upcomingReservation
    ? sortedReservations.filter((r) => r.id !== upcomingReservation.id)
    : sortedReservations;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-36 font-extrabold text-gray-900">마이페이지</h1>
          <p className="text-16 text-gray-500">예약 목록을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <h1 className="text-36 font-extrabold text-gray-900">마이페이지</h1>
          <p className="text-16 text-error-500">{error}</p>
        </div>
      </div>
    );
  }

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
              <FeaturedTicket
                reservation={upcomingReservation}
                onCancelClick={handleCancelClick}
              />
            </section>
          )}

          <section>
            <h2 className="mb-5 text-20 font-bold text-gray-700">전체 예약 내역</h2>
            {listReservations.length === 0 && !upcomingReservation ? (
              <p className="text-16 text-gray-400">아직 예약한 이벤트가 없습니다.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {listReservations.map((reservation) => (
                  <ReservationTicket
                    key={reservation.id}
                    reservation={reservation}
                    onCancelClick={handleCancelClick}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {viewMode === 'grid' && (
        <section>
          <h2 className="mb-5 text-24 font-extrabold text-gray-900">나의 예약 현황</h2>
          {sortedReservations.length === 0 ? (
            <p className="text-16 text-gray-400">아직 예약한 이벤트가 없습니다.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sortedReservations.map((reservation) => {
                const isEnded = isEventEnded(reservation.eventEndTime);
                const canCancel = isCancellable(reservation);
                return (
                  <div
                    key={reservation.id}
                    className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
                  >
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ApplicationUnitLabel applicationUnit={reservation.applicationUnit} />
                          <EventCategoryLabel category={reservation.eventTrack} />
                          <ReservationStatusBadge status={reservation.status} isEnded={isEnded} />
                        </div>
                        {canCancel && (
                          <button
                            type="button"
                            onClick={() => handleCancelClick(reservation)}
                            className="rounded-lg border border-error-500 bg-white px-2 py-1 text-12 font-bold text-error-500 transition hover:bg-error-50"
                          >
                            취소
                          </button>
                        )}
                      </div>
                      <h3 className="text-16 leading-7 font-bold text-gray-900">
                        {reservation.eventTitle}
                      </h3>
                    </div>
                    <div className="mt-auto flex min-h-[120px] flex-col gap-2 border-t border-gray-100 bg-brand-50 px-5 py-4">
                      {getOrderedExtraInfo(reservation.extraInfo).map(([key, value]) => (
                        <div key={key} className="flex items-center text-12 text-gray-700">
                          <span className="w-12 shrink-0 font-bold text-brand-500">
                            {EXTRA_INFO_LABELS[key] ?? key}
                          </span>
                          <span className="truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <CancelConfirmModal
        isOpen={cancelTarget !== null}
        reservation={cancelTarget}
        isSubmitting={isCancelling}
        onConfirm={handleCancelConfirm}
        onClose={handleCancelClose}
      />
    </div>
  );
}

export default CamperMyPage;
