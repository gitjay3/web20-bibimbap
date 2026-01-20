import type { RegistrationStaus } from '@/types/camper';
import cn from '@/utils/cn';

interface RegistrationLabelProps {
  status: RegistrationStaus
}

const STATUS_LABEL_TEXT: Record<'INVITED' | 'CLAIMED', string> = {
  INVITED: '대기',
  CLAIMED: '완료',
};

function RegistrationLabel({ status }: RegistrationLabelProps) {
  return (
    <span
      className={cn(
        'w-fit text-12 flex h-5 items-center rounded-sm px-2 font-bold',
        status === 'CLAIMED'
          ? 'bg-brand-surface-default text-white'
          : 'bg-neutral-surface-default text-neutral-text-secondary border-neutral-border-default border',
      )}
    >
      {STATUS_LABEL_TEXT[status]}
    </span>
  );
}

export default RegistrationLabel;
