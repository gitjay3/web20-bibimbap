import { useState } from 'react';
import Modal from '@/components/Modal';
import TextInput from '@/components/TextInput';
import Dropdown from '@/components/Dropdown';
import Button from '@/components/Button';
import type { SlotFieldType } from '@/types/event';

interface FieldAddModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string, type: SlotFieldType) => void;
}

const FIELD_TYPE_OPTIONS = [
  { key: 'text', label: '텍스트' },
  { key: 'number', label: '숫자' },
  { key: 'date', label: '날짜' },
  { key: 'time', label: '시간' },
] as const;

export default function FieldAddModal({ open, onClose, onAdd }: FieldAddModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<SlotFieldType>('text');

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), type);
    setName('');
    setType('text');
    onClose();
  };

  const handleClose = () => {
    setName('');
    setType('text');
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={handleClose}>
      <h2 className="mb-6 text-20 font-bold text-neutral-text-primary">항목 추가</h2>
      <div className="flex flex-col gap-5 py-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="field-name" className="text-14 font-medium text-neutral-text-secondary">
            항목 이름
          </label>
          <TextInput
            id="field-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 장소, 멘토, 담당자 등"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-14 font-medium text-neutral-text-secondary">데이터 타입</span>
          <Dropdown
            options={FIELD_TYPE_OPTIONS}
            value={type}
            setValue={(val) => setType(val as SlotFieldType)}
          />
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button type="secondary" variant="outline" onClickHandler={handleClose}>
            취소
          </Button>
          <Button onClickHandler={handleAdd} disabled={!name.trim()}>
            추가하기
          </Button>
        </div>
      </div>
    </Modal>
  );
}
