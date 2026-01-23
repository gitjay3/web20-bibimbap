import { useState } from 'react';
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
import DropdownMenu from '@/components/DropdownMenu';
import { useAuth } from '@/store/AuthContext';
import { deleteEvent } from '@/api/event';

interface EventCardProps {
  event: Event;
  onDeleted?: () => void;
}

function EventCard({ event, onDeleted }: EventCardProps) {
  const { orgId } = useParams<{ orgId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const { id, track, status, title, description, startTime, endTime, applicationUnit } = event;

  const handleEdit = () => {
    navigate(`/orgs/${orgId}/events/${id}/edit`);
  };

  const handleDeleteConfirm = async () => {
    await deleteEvent(id);
    setIsDeleteModalOpen(false);
    onDeleted?.();
  };

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
        onCancel={() => setIsDeleteModalOpen(false)}
        variant="danger"
      />
    </>
  );
}

export default EventCard;
