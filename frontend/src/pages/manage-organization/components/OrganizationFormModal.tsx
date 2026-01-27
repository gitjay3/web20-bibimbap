import { useEffect, useId, useState } from 'react';
import Modal from '@/components/Modal';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import FloppyDiskIcon from '@/assets/icons/floppy-disk.svg?react';
import type { Organization } from '@/api/organization';

interface OrganizationFormModalProps {
  isOpen: boolean;
  organization: Organization | null;
  onClose: () => void;
  onSave: (data: { name: string }) => Promise<void>;
}

function OrganizationFormModal({
  isOpen,
  organization,
  onClose,
  onSave,
}: OrganizationFormModalProps) {
  const nameId = useId();
  const [name, setName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(organization?.name ?? '');
    setErrorMessage('');
  }, [organization, isOpen]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();

    if (!trimmedName) {
      setErrorMessage('조직명을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({ name: trimmedName });
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-4">
        <div>
          <h2 className="text-20 font-bold">{organization ? '조직 정보 수정' : '조직 추가'}</h2>
          <p className="text-neutral-text-secondary text-14 mt-1">조직명을 입력해 주세요.</p>
        </div>
        <div>
          <label htmlFor={nameId} className="text-16 mb-2 block font-bold">
            조직명
          </label>
          <TextInput
            id={nameId}
            value={name}
            placeholder="예: 부스트캠프"
            onChange={(event) => {
              setName(event.target.value);
              if (errorMessage) setErrorMessage('');
            }}
            disabled={isSubmitting}
          />
          {errorMessage && <p className="text-12 mt-1 text-red-500">{errorMessage}</p>}
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="secondary"
            variant="outline"
            onClickHandler={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="secondary" htmlType="submit" disabled={isSubmitting}>
            <FloppyDiskIcon className="h-4 w-4" />
            저장
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default OrganizationFormModal;
