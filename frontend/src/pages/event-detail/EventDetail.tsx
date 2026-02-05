import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'react-router';
import PageMeta from '@/components/PageMeta';
import type { EventDetail as EventDetailType, EventSlot } from '@/types/event';
import { getEvent, getEventPollingStatus } from '@/api/event';
import cn from '@/utils/cn';
import { updateEventSlot, deleteEventSlot, createEventSlot } from '@/api/eventSlot';
import { getMyReservationForEvent } from '@/api/reservation';
import type { ReservationApiResponse } from '@/types/BEapi';
import useQueue from '@/hooks/useQueue';
import QueueStatus from '@/components/QueueStatus';
import { useAuth } from '@/store/AuthContext';
import ConfirmModal from '@/components/DropdownConfirmModal';
import SlotEditModal from '@/components/SlotEditModal';
import CONFIG from '@/config/polling.config';
import EventDetailHeader from './components/EventDetailHeader';
import ReservationButton from './components/ReservationButton';
import SlotList from './components/SlotList';

function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [myReservation, setMyReservation] = useState<ReservationApiResponse | null>(null);
  const [event, setEvent] = useState<EventDetailType | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSlot, setEditingSlot] = useState<EventSlot | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<EventSlot | null>(null);
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);

  const isLoggedIn = user !== null;
  const isAdmin = user?.role === 'ADMIN';
  const eventId = id ? Number(id) : NaN;
  const eventStatus = event?.status;

  const canReserveByTrack = event?.canReserveByTrack !== false;
  const isQueueEnabled = eventStatus === 'ONGOING' && isLoggedIn && canReserveByTrack;

  const {
    position,
    totalWaiting,
    hasToken,
    tokenExpiresAt,
    inQueue,
    isLoading: isQueueLoading,
    error: queueErrorMessage,
    isNew,
    enter: enterQueue,
  } = useQueue({
    eventId,
    enabled: isQueueEnabled,
  });

  // 이벤트 정보 불러오기
  const fetchEvent = useCallback(async () => {
    if (!eventId || Number.isNaN(eventId)) return;

    try {
      const eventData = await getEvent(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('이벤트 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  const fetchMyReservation = useCallback(async () => {
    if (!eventId || Number.isNaN(eventId)) return;

    try {
      const reservation = await getMyReservationForEvent(eventId);
      setMyReservation((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(reservation)) return prev;
        return reservation;
      });
    } catch {
      setMyReservation(null);
    }
  }, [eventId]);

  // 폴링: 슬롯 정원 + 내 예약
  const fetchPollingStatus = useCallback(async () => {
    if (!eventId || Number.isNaN(eventId)) return;

    try {
      const { slotAvailability, myReservation: reservation } = await getEventPollingStatus(eventId);

      // 슬롯 정원 업데이트
      setEvent((prevEvent) => {
        if (!prevEvent) return null;

        let changed = false;

        const nextSlots = prevEvent.slots.map((slot) => {
          const updated = slotAvailability.slots.find((s) => s.slotId === slot.id);
          if (!updated) return slot;

          const isCountChanged = slot.currentCount !== updated.currentCount;
          const isReserverChanged =
            JSON.stringify(slot.reservations) !== JSON.stringify(updated.reservations);

          if (isCountChanged || isReserverChanged) {
            changed = true;
            return {
              ...slot,
              currentCount: updated.currentCount,
              reservations: updated.reservations,
            };
          }
          return slot;
        });

        if (!changed) return prevEvent;
        return { ...prevEvent, slots: nextSlots };
      });

      // 내 예약 업데이트
      setMyReservation((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(reservation)) return prev;
        return reservation;
      });
    } catch (error) {
      console.error('폴링 상태 갱신 실패:', error);
    }
  }, [eventId]);

  // 초기 로드
  useEffect(() => {
    fetchEvent();
    fetchMyReservation();
  }, [fetchEvent, fetchMyReservation]);

  // 탭 비활성 시 폴링 일시 중단
  const isPageVisibleRef = useRef(true);
  useEffect(() => {
    const onVisibilityChange = () => {
      isPageVisibleRef.current = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // 실시간 폴링 (슬롯 정원 + 내 예약 통합)
  useEffect(() => {
    if (eventStatus !== 'ONGOING') return () => {};

    // 첫 갱신
    fetchPollingStatus();

    const intervalId = setInterval(() => {
      if (!isPageVisibleRef.current) return;
      fetchPollingStatus();
    }, CONFIG.polling.eventDetail);

    return () => clearInterval(intervalId);
  }, [eventStatus, fetchPollingStatus]);

  const handleReservationSuccess = useCallback(() => {
    setSelectedSlotId(null);
    fetchEvent();
    fetchMyReservation();
  }, [fetchEvent, fetchMyReservation]);

  const handleCancelSuccess = useCallback(() => {
    setMyReservation(null);
    fetchEvent();
    enterQueue();
  }, [fetchEvent, enterQueue]);

  const handleSaveSlot = useCallback(
    async (data: { slotId?: number; maxCapacity: number; extraInfo: Record<string, unknown> }) => {
      if (!data.slotId) return;
      await updateEventSlot(data.slotId, {
        maxCapacity: data.maxCapacity,
        extraInfo: data.extraInfo,
      });
      setEditingSlot(null);
      fetchEvent();
    },
    [fetchEvent],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingSlot) return;
    await deleteEventSlot(deletingSlot.id);
    setDeletingSlot(null);
    fetchEvent();
  }, [deletingSlot, fetchEvent]);

  const handleCreateSlot = useCallback(
    async (data: { eventId?: number; maxCapacity: number; extraInfo: Record<string, unknown> }) => {
      await createEventSlot({
        eventId: Number(id),
        maxCapacity: data.maxCapacity,
        extraInfo: data.extraInfo,
      });
      setIsCreatingSlot(false);
      fetchEvent();
    },
    [id, fetchEvent],
  );

  const handleAddSlot = useCallback(() => {
    setIsCreatingSlot(true);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditingSlot(null);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    setIsCreatingSlot(false);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeletingSlot(null);
  }, []);

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
      <PageMeta
        title={event.title}
        description={
          event.description || '이벤트 일정과 상세 정보를 확인하고 예약 여부를 결정할 수 있습니다.'
        }
      />
      <div className={cn('w-full max-w-200', !isAdmin && 'pb-24')}>
        <div className="flex flex-col gap-6">
          <EventDetailHeader
            category={event.track}
            status={event.status}
            title={event.title}
            description={event.description}
            applicationUnit={event.applicationUnit}
          />
          <hr className="border-neutral-border-default" />

          {/* 대기열 상태 (ONGOING일 때만 표시, 관리자 제외) */}
          {!isAdmin && event.status === 'ONGOING' && isLoggedIn && canReserveByTrack && (
            <QueueStatus
              position={position}
              totalWaiting={totalWaiting}
              hasToken={hasToken}
              tokenExpiresAt={tokenExpiresAt}
              isLoading={isQueueLoading}
              isNew={isNew}
            />
          )}
          {!isAdmin && event.status === 'ONGOING' && !isLoggedIn && (
            <div className="border-neutral-border-default bg-neutral-surface-default rounded-lg border p-4">
              <p className="text-neutral-text-secondary text-center">
                예약하려면 로그인이 필요합니다.
              </p>
            </div>
          )}

          <SlotList
            status={event.status}
            slotSchema={event.slotSchema}
            slots={event.slots}
            selectedSlotId={selectedSlotId}
            setSelectedSlotId={setSelectedSlotId}
            myReservation={myReservation}
            applicationUnit={event.applicationUnit}
            disabled={event.status === 'ONGOING' && !hasToken}
            isAdmin={isAdmin}
            onEditSlot={setEditingSlot}
            onDeleteSlot={setDeletingSlot}
            onAddSlot={handleAddSlot}
          />
          <SlotEditModal
            open={!!editingSlot}
            mode="edit"
            slot={editingSlot}
            slotSchema={event?.slotSchema}
            onClose={handleCloseEditModal}
            onSave={handleSaveSlot}
          />
          <SlotEditModal
            open={isCreatingSlot}
            mode="create"
            eventId={Number(id)}
            slot={null}
            slotSchema={event?.slotSchema}
            onClose={handleCloseCreateModal}
            onSave={handleCreateSlot}
          />
          <ConfirmModal
            open={!!deletingSlot}
            title="일정 삭제"
            message="이 일정을 제거하시겠습니까?"
            confirmText="제거"
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            variant="danger"
          />
        </div>
      </div>

      {!isAdmin && (
        <ReservationButton
          eventId={eventId}
          isReservable={event.status === 'ONGOING' && hasToken}
          selectedSlotId={selectedSlotId}
          myReservation={myReservation}
          onReservationSuccess={handleReservationSuccess}
          onCancelSuccess={handleCancelSuccess}
          canReserveByTrack={event.canReserveByTrack}
          eventTrack={event.track}
          isInQueue={isQueueEnabled && !hasToken && inQueue}
          isQueueLoading={isQueueEnabled && isQueueLoading}
          queueErrorMessage={isQueueEnabled ? queueErrorMessage : null}
        />
      )}
    </div>
  );
}

export default EventDetail;
