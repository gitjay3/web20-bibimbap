import Modal from '@/components/Modal';
import type { ApplicationUnit, TeamMember } from '@/types/event';

interface Reserver {
  name: string;
  username: string;
  avatarUrl: string | null;
  groupNumber?: number;
  teamMembers?: TeamMember[];
}

interface ReserverListModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservers: Reserver[];
  applicationUnit: ApplicationUnit;
}

function ReserverListModal({
  isOpen,
  onClose,
  reservers,
  applicationUnit,
}: ReserverListModalProps) {
  const renderContent = () => {
    if (reservers.length === 0) {
      return (
        <div className="text-neutral-text-tertiary flex h-32 items-center justify-center">
          {applicationUnit === 'TEAM' ? '예약된 팀이 없습니다.' : '예약자가 없습니다.'}
        </div>
      );
    }

    if (applicationUnit === 'TEAM') {
      return (
        <div className="flex flex-col gap-y-4">
          {reservers.map((reserver, index) => (
            <div
              key={`team-${reserver.groupNumber}-${index}`}
              className="border-neutral-border-default rounded-xl border p-4"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="bg-brand-500 text-14 rounded-full px-2.5 py-1 font-bold text-white">
                  {reserver.groupNumber}조
                </span>
                <span className="text-14 text-neutral-text-tertiary">
                  ({reserver.teamMembers?.length ?? 0}명)
                </span>
              </div>
              <div className="flex flex-col gap-y-2">
                {reserver.teamMembers?.map((member, idx) => (
                  <div key={`${member.username}-${idx}`} className="flex items-center gap-x-3">
                    <img
                      src={member.avatarUrl ?? undefined}
                      alt={member.name}
                      className="border-neutral-border-default h-8 w-8 flex-shrink-0 rounded-full border object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div className="flex flex-col">
                      <span className="text-14 text-neutral-text-primary font-medium">
                        {member.name}
                      </span>
                      <span className="text-12 text-neutral-text-tertiary">@{member.username}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-y-1">
        {reservers.map((reserver, index) => (
          <div
            key={`${reserver.username}-${index}`}
            className="hover:bg-neutral-surface-default flex items-center gap-x-4 rounded-xl p-3 transition-colors"
          >
            <img
              src={reserver.avatarUrl ?? undefined}
              alt={reserver.name}
              className="border-neutral-border-default h-10 w-10 flex-shrink-0 rounded-full border object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex flex-col">
              <span className="text-16 text-neutral-text-primary font-semibold">
                {reserver.name}
              </span>
              <span className="text-14 text-neutral-text-tertiary">@{reserver.username}</span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-y-6">
        <h2 className="text-20 text-neutral-text-primary px-1 font-bold">
          {applicationUnit === 'TEAM'
            ? `예약 그룹 목록 (${reservers.length}팀)`
            : `예약자 명단 (${reservers.length}명)`}
        </h2>

        <div className="custom-scrollbar flex max-h-[400px] flex-col overflow-y-auto px-1">
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
}

export default ReserverListModal;
