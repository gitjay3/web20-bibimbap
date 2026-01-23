import { useMemo, useRef, useState } from 'react';
import useOutsideClick from '@/hooks/useOutsideClick';
import cn from '@/utils/cn';
import DownIcon from '@/assets/icons/chevron-down.svg?react';
import CheckIcon from '@/assets/icons/check.svg?react';

type DropdownOption<T extends string> = {
  key: T;
  label: string;
};

interface DropdownProps<T extends string> {
  options: readonly DropdownOption<T>[];
  value: T;
  setValue: (value: T) => void;
  className?: string;
}

function Dropdown<T extends string>({ options, value, setValue, className }: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLabel = useMemo(
    () => options.find((o) => o.key === value)?.label ?? value,
    [options, value],
  );

  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setIsOpen(false));

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        className="border-neutral-border-default flex h-10 w-full cursor-pointer items-center justify-between rounded-md border bg-white px-3 text-14"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div>{selectedLabel}</div>
        <DownIcon className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && (
        <div className="border-neutral-border-default text-neutral-text-secondary absolute top-12 right-0 z-50 flex w-full flex-col overflow-hidden rounded-xl border bg-white p-2 shadow-md">
          {options.map((option) => (
            <button
              type="button"
              key={option.key}
              className={cn(
                'flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-14 text-start',
                option.key === value ? 'bg-neutral-surface-default' : 'bg-white',
              )}
              style={option.key === value ? { color: 'var(--color-brand-500)' } : undefined}
              onClick={() => {
                setValue(option.key);
                setIsOpen(false);
              }}
            >
              {option.label}
              {option.key === value && <CheckIcon className="h-4 w-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
