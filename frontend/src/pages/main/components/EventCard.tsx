import { useState, useCallback, useEffect } from 'react';
import ConfirmModal from '@/components/DropdownConfirmModal';
import ApplicationUnitLabel from '@/components/ApplicationUnitLabel';
import EventCategoryLabel from '@/components/EventCategoryLabel';
import EventStatusLabel from '@/components/EventStatusLabel';
import type { Event } from '@/types/event';
import formatKoreanDateTime from '@/utils/formatKoreanDateTime';
import CalendarIcon from '@/assets/icons/calendar-clock.svg?react';
import { Link, useParams, useNavigate } from 'react-router';
import Card from '@/components/Card';
import EditIcon from '@/assets/icons/edit.svg?react';
import TrashIcon from '@/assets/icons/trash.svg?react';
import BellIcon from '@/assets/icons/bell.svg?react';
import BellRingIcon from '@/assets/icons/bell-ring.svg?react';
import DropdownMenu from '@/components/DropdownMenu';
import { useAuth } from '@/store/AuthContext';
import { deleteEvent } from '@/api/event';
import { getMyNotification } from '@/api/notification';
import EventNotificationModal from './EventNotificationModal';

interface EventCardProps {
  event: Event;
  onDeleted?: () => void;
}

function EventCard({ event, onDeleted }: EventCardProps) {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [hasNotification, setHasNotification] = useState(false);

   
  const { id, track, status, title, description, startTime, endTime, applicationUnit } = event;

  const isUpcoming = status === 'UPCOMING' || (new Date(startTime) > new Date());

  useEffect(() => {
    if (isUser && isUpcoming && event.isSlackEnabled && orgId) {
      getMyNotification(orgId, id).then((data) => {
        setHasNotification(!!data);
      });
    }
  }, [isUser, isUpcoming, event.isSlackEnabled, orgId, id, isNotificationModalOpen]); // Modal 닫힐 때 최신 상태 반영을 위해 의존성 추가

  const handleEdit = () => {
    navigate(`/orgs/${orgId}/events/${id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    await deleteEvent(id);
    setIsDeleteModalOpen(false);
    onDeleted?.();
  };

  const handleCancelDelete = useCallback(() => {
    setIsDeleteModalOpen(false);
  }, []);

  const menuItems = [
    {
      label: '수정',
      onClick: handleEdit,
      icon: <EditIcon className="h-4 w-4" />,
    },
    {
      label: '삭제',
      onClick: () => setIsDeleteModalOpen(true),
      icon: <TrashIcon className="h-4 w-4" />,
      variant: 'danger' as const,
    },
  ];

  return (
    <>
      <Card>
        {isAdmin && (
          <div className="absolute top-3 right-3 z-10">
            <DropdownMenu items={menuItems} />
          </div>
        )}
        
        {isUser && isUpcoming && event.isSlackEnabled && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setIsNotificationModalOpen(true);
            }}
            className="absolute top-3 right-3 z-10 p-1 rounded-full hover:bg-neutral-100 transition-colors"
          >
            {hasNotification ? (
              <BellRingIcon className="h-5 w-5 text-brand-500" />
            ) : (
              <BellIcon className="h-5 w-5 text-neutral-text-tertiary" />
            )}
          </button>
        )}

        <Link to={`/orgs/${orgId}/events/${id}`} className="flex h-full flex-col justify-between">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <ApplicationUnitLabel applicationUnit={applicationUnit} />
              <EventCategoryLabel category={track} />
              <EventStatusLabel status={status} />
            </div>
            <div className="text-20 font-extrabold">{title}</div>
            <div className="text-12 text-neutral-text-secondary">{description}</div>
          </div>
          <div className="bg-neutral-surface-default text-12 text-neutral-text-secondary flex h-8 items-center gap-2 rounded-md px-3">
            <CalendarIcon className="text-brand-text-primary h-4 w-4" />
            {`${formatKoreanDateTime(startTime)} ~ ${formatKoreanDateTime(endTime)}`}
          </div>
        </Link>
      </Card>

      <ConfirmModal
        open={isDeleteModalOpen}
        title="이벤트 삭제"
        message="이 이벤트를 삭제하시겠습니까? 모든 일정이 함께 삭제됩니다."
        confirmText="삭제"
        onConfirm={handleDeleteConfirm}
        onCancel={handleCancelDelete}
        variant="danger"
      />

      {isUser && isUpcoming && event.isSlackEnabled && (
        <EventNotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
          eventId={id}
          startTime={new Date(startTime)}
        />
      )}
    </>
  );
}

export default EventCard;
