import Modal from '@/components/Modal';

interface Reserver {
  name: string;
  username: string;
  avatarUrl: string;
}

interface ReserverListModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservers: Reserver[];
}

function ReserverListModal({ isOpen, onClose, reservers }: ReserverListModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col gap-y-6">
        <h2 className="text-20 font-bold text-neutral-text-primary px-1">
          예약자 명단 ({reservers.length}명)
        </h2>

        <div className="flex max-h-[400px] flex-col overflow-y-auto px-1 custom-scrollbar">
          {reservers.length > 0 ? (
            <div className="flex flex-col gap-y-1">
              {reservers.map((reserver, index) => (
                <div
                  key={`${reserver.username}-${index}`}
                  className="flex items-center gap-x-4 rounded-xl p-3 hover:bg-neutral-surface-default transition-colors"
                >
                  <img
                    src={reserver.avatarUrl}
                    alt={reserver.name}
                    className="h-10 w-10 rounded-full object-cover border border-neutral-border-default flex-shrink-0"
                  />
                  <div className="flex flex-col">
                    <span className="text-16 font-semibold text-neutral-text-primary">
                      {reserver.name}
                    </span>
                    <span className="text-14 text-neutral-text-tertiary">
                      @{reserver.username}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-neutral-text-tertiary">
              예약자가 없습니다.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default ReserverListModal;
