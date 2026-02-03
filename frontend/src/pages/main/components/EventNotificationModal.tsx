import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { toast } from 'sonner';
import Modal from '@/components/Modal';
import {
  setNotification,
  deleteNotification,
  type NotificationResponse,
} from '@/api/notification';

interface EventNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
  startTime: Date;
  initialNotification: NotificationResponse | null;
  onUpdated: (notification: NotificationResponse | null) => void;
}

const TIME_OPTIONS = [
  { label: '5분 전', value: 5 },
  { label: '10분 전', value: 10 },
  { label: '30분 전', value: 30 },
  { label: '1시간 전', value: 60 },
];

function EventNotificationModal({
  isOpen,
  onClose,
  eventId,
  startTime,
  initialNotification,
  onUpdated,
}: EventNotificationModalProps) {
  const { orgId } = useParams<{ orgId: string }>();
  const [isEnabled, setIsEnabled] = useState(!!initialNotification);
  const [selectedTime, setSelectedTime] = useState<number>(initialNotification?.notificationTime ?? 5);
  const [isLoading, setIsLoading] = useState(false);

  const isValidTime = (minutes: number) => {
    const alertTime = new Date(new Date(startTime).getTime() - minutes * 60 * 1000);
    return alertTime > new Date(); // Future time only
  };

  // Sync internal state when initialNotification changes (e.g., from parent)
  useEffect(() => {
    setIsEnabled(!!initialNotification);
    setSelectedTime(initialNotification?.notificationTime ?? 5);
  }, [initialNotification]);

  const handleToggle = async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      if (isEnabled) {
        // OFF: Delete notification
        await deleteNotification(orgId, eventId);
        setIsEnabled(false);
        onUpdated(null);
        toast.success('알림이 해제되었습니다.');
      } else {
        // ON: Set notification (default or current selected)
        // Check if current selectedTime is valid
        const validTime = isValidTime(selectedTime) ? selectedTime : 5;
        if (!isValidTime(validTime)) {
             toast.error('설정 가능한 시간이 없습니다.');
             setIsEnabled(false);
             return;
        }

        const data = await setNotification(orgId, eventId, validTime);
        setIsEnabled(true);
        setSelectedTime(validTime);
        onUpdated(data);
        toast.success('알림이 설정되었습니다.');
      }
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || '알림 설정을 변경하는데 실패했습니다.';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeChange = async (time: number) => {
    if (!orgId || !isEnabled) return;
    if (time === selectedTime) return;
    
    setIsLoading(true);
    try {
      const data = await setNotification(orgId, eventId, time);
      setSelectedTime(time);
      onUpdated(data);
      toast.success('알림 시간이 변경되었습니다.');
    } catch (error) {
       const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || '알림 시간 변경에 실패했습니다.';
       toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-20 font-bold mb-2">예약 오픈 알림</h2>
      <p className="text-14 text-neutral-text-secondary mb-6">
        예약 시작 전에 슬랙으로 알림을 받아보세요.
      </p>

      {/* Toggle */}
      <div className="flex items-center justify-between mb-8">
        <span className="text-16 font-medium text-neutral-text-primary">알림 받기</span>
        <button
          type="button"
          onClick={handleToggle}
          disabled={isLoading}
          aria-label={isEnabled ? '알림 끄기' : '알림 켜기'}
          className={`
            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none
            ${isEnabled ? 'bg-brand-500' : 'bg-gray-200'}
          `}
        >
          <span
            className={`
              inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
              ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      </div>

      {/* Time Options */}
     <div className={`transition-opacity duration-200 ${isEnabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
        <p className="text-14 text-neutral-text-secondary mb-3">알림 시점</p>
        <div className="grid grid-cols-2 gap-y-3">
          {TIME_OPTIONS.map((option) => {
            const disabled = !isValidTime(option.value);
            return (
              <label
                key={option.value}
                className={`flex items-center space-x-2 text-14 ${
                  disabled ? 'text-neutral-text-tertiary cursor-not-allowed' : 'text-neutral-text-primary cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="notificationTime"
                  value={option.value}
                  checked={selectedTime === option.value}
                  onChange={() => handleTimeChange(option.value)}
                  disabled={disabled}
                  className="w-4 h-4 text-brand-500 border-gray-300 focus:ring-brand-500 disabled:bg-gray-100"
                />
                <span>{option.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}

export default EventNotificationModal;
