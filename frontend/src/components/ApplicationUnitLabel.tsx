import type { ApplicationUnit } from '@/types/event';
import IndividualIcon from '@/assets/icons/user.svg?react';
import TeamIcon from '@/assets/icons/users.svg?react';

interface ApplicationUnitLabelProps {
  applicationUnit: ApplicationUnit;
}

function ApplicationUnitLabel({ applicationUnit }: ApplicationUnitLabelProps) {
  return applicationUnit === 'INDIVIDUAL' ? (
    <IndividualIcon className="text-neutral-text-tertiary h-5 w-5" />
  ) : (
    <TeamIcon className="text-neutral-text-tertiary h-5 w-5" />
  );
}

export default ApplicationUnitLabel;
