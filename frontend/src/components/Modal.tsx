import { useEffect, useRef, type ReactNode } from 'react';
import useOutsideClick from '@/hooks/useOutsideClick';
import XMarkIcon from '@/assets/icons/x-mark.svg?react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

function Modal({ isOpen, onClose, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useOutsideClick(modalRef, onClose);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="relative max-h-[90vh] w-full max-w-[540px] overflow-visible rounded-xl bg-white p-8"
      >
        <button
          type="button"
          className="absolute right-4 top-4 cursor-pointer text-neutral-text-secondary hover:text-neutral-text-primary"
          onClick={onClose}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        {children}
      </div>
    </div>
  );
}

export default Modal;
