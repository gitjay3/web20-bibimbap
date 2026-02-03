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
  onSave: (data: {
    name: string;
    slackWorkspaceId?: string;
    slackBotToken?: string;
  }) => Promise<void>;
}

function OrganizationFormModal({
  isOpen,
  organization,
  onClose,
  onSave,
}: OrganizationFormModalProps) {
  const nameId = useId();
  const botTokenId = useId();

  const [name, setName] = useState('');
  const [slackWorkspaceId, setSlackWorkspaceId] = useState('');
  const [slackBotToken, setSlackBotToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(organization?.name ?? '');
    setSlackWorkspaceId(organization?.slackWorkspaceId ?? '');
    setSlackBotToken(''); // 입력창은 항상 빈 상태로 시작
    setShowToken(false);
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
      await onSave({
        name: trimmedName,
        slackBotToken: slackBotToken.trim() || undefined,
      });
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
          <p className="text-neutral-text-secondary text-14 mt-1">조직 정보를 입력해 주세요.</p>
        </div>

        {/* 조직명 */}
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

        <div className="border-t border-neutral-border-default pt-4">
          <h3 className="text-16 mb-4 font-bold text-neutral-text-primary">슬랙 통합 설정 (선택)</h3>
          
          <div className="space-y-4">
            {/* 워크스페이스 정보 (조회 전용) */}
            {slackWorkspaceId && (
              <div className="bg-neutral-50 flex items-center justify-between rounded-lg border border-neutral-border-default px-4 py-3">
                <span className="text-neutral-text-secondary text-14">연동된 워크스페이스</span>
                <span className="text-neutral-text-primary text-14">
                  {slackWorkspaceId}
                </span>
              </div>
            )}

            {/* 봇 토큰 */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor={botTokenId} className="text-14 font-medium">
                  슬랙 알림봇 토큰 (xoxb-...)
                </label>
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-neutral-text-tertiary hover:text-brand-text-primary text-12 underline underline-offset-2"
                >
                  {showToken ? '비밀번호 숨기기' : '비밀번호 보기'}
                </button>
              </div>
              <TextInput
                id={botTokenId}
                type={showToken ? 'text' : 'password'}
                value={slackBotToken}
                placeholder={
                  organization?.isSlackEnabled
                    ? '변경하려면 새 토큰을 입력하세요'
                    : 'xoxb-로 시작하는 토큰을 입력하세요'
                }
                onChange={(event) => setSlackBotToken(event.target.value)}
                disabled={isSubmitting}
                className="text-14"
              />
              <p className="text-neutral-text-tertiary text-12 mt-2 leading-5">
                {organization?.isSlackEnabled ? (
                  <span className="text-brand-text-primary">
                    * 이미 슬랙 토큰이 안전하게 등록되어 있습니다.
                  </span>
                ) : (
                  '* 토큰을 저장하면 워크스페이스 ID가 자동으로 인식되어 연동됩니다.'
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
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
