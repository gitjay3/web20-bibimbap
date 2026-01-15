import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import type { EventDetail as EventDetailType } from '@/types/event';
import { getEvent } from '@/api/event';
import { getSlotAvailability } from '@/api/eventSlot';
import { getMyReservationForEvent } from '@/api/reservation';
import type { ReservationApiResponse } from '@/types/BEapi';
import EventDetailHeader from './components/EventDetailHeader';
import ReservationButton from './components/ReservationButton';
import SlotList from './components/SlotList';

const POLLING_INTERVAL = 1000; // 성능 보면서 ms 단위로 바꿔도?

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const [myReservation, setMyReservation] = useState<ReservationApiResponse | null>(null);
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 이벤트 정보 불러오기
  const fetchEvent = useCallback(async () => {
    if (!id) return;

    try {
      const eventData = await getEvent(Number(id));
      setEvent(eventData);
    } catch (error) {
      console.error('이벤트 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // 이 이벤트가 내 예약인지 조회
  const fetchMyReservation = useCallback(async () => {
    if (!id) return;

    try {
      const reservation = await getMyReservationForEvent(Number(id));
      setMyReservation(reservation);
    } catch {
      // 로그인 안 된 경우 등 에러 무시 TODO: 로그인, mypage랑 연계
      setMyReservation(null);
    }
  }, [id]);

  // 실시간 정원 폴링
  const updateSlotAvailability = useCallback(async () => {
    if (!id) return;

    try {
      const availabilityData = await getSlotAvailability(Number(id));

      // TODO : 나중에 정보 비교해서 변경사항 없으면 리렌더링 안되게

      setEvent((prevEvent) => {
        if (!prevEvent) return null;

        return {
          ...prevEvent,
          slots: prevEvent.slots.map((slot) => {
            const updatedSlot = availabilityData.slots.find((s) => s.slotId === slot.id);

            if (updatedSlot) {
              return {
                ...slot,
                currentCount: updatedSlot.currentCount,
              };
            }

            return slot;
          }),
        };
      });
    } catch (error) {
      console.error('실시간 정원 갱신 실패:', error);
    }
  }, [id]);

  // 초기 로드
  useEffect(() => {
    fetchEvent();
    fetchMyReservation();
  }, [fetchEvent, fetchMyReservation]);

  // 실시간 정원 폴링
  useEffect(() => {
    if (!event || event.status !== 'ONGOING') {
      return () => {};
    }
    // TODO : 사용자가 다른 탭으로 이동하면 폴링을 일시 중단

    updateSlotAvailability();

    // 폴링
    const intervalId = setInterval(() => {
      updateSlotAvailability();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [event, updateSlotAvailability]);

  const handleReservationSuccess = useCallback(() => {
    setSelectedSlotId(null);
    // 예약 성공 시 이벤트 정보 갱신
    fetchEvent();
    fetchMyReservation();
  }, [fetchEvent, fetchMyReservation]);

  const handleCancelSuccess = useCallback(() => {
    setMyReservation(null);
    fetchEvent();
  }, [fetchEvent]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-neutral-text-secondary">로딩 중...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-neutral-text-secondary">이벤트를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="w-160">
        <div className="flex flex-col gap-6">
          <EventDetailHeader
            category={event.track}
            status={event.status}
            title={event.title}
            description={event.description}
            applicationUnit={event.applicationUnit}
          />
          <hr className="border-neutral-border-default" />
          <SlotList
            status={event.status}
            slotSchema={event.slotSchema}
            slots={event.slots}
            selectedSlotId={selectedSlotId}
            setSelectedSlotId={setSelectedSlotId}
          />
        </div>
      </div>
      <ReservationButton
        isReservable={event.status === 'ONGOING'}
        selectedSlotId={selectedSlotId}
        myReservation={myReservation}
        onReservationSuccess={handleReservationSuccess}
        onCancelSuccess={handleCancelSuccess}
      />
    </div>
  );
}

export default EventDetail;
