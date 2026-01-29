import { useId, useState } from 'react';
import Modal from '@/components/Modal';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import PlusIcon from '@/assets/icons/plus.svg?react';

interface InviteAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (githubUsername: string) => Promise<void>;
}

function InviteAdminModal({ isOpen, onClose, onInvite }: InviteAdminModalProps) {
  const inputId = useId();
  const [githubUsername, setGithubUsername] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setGithubUsername('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedUsername = githubUsername.trim();

    if (!trimmedUsername) {
      setErrorMessage('GitHub 사용자명을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onInvite(trimmedUsername);
      setGithubUsername('');
      setErrorMessage('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pt-4">
        <div>
          <h2 className="text-20 font-bold">운영진 초대</h2>
          <p className="text-neutral-text-secondary text-14 mt-1">
            초대할 운영진의 GitHub 사용자명을 입력해주세요.
            <br />
            초대받은 사람이 GitHub으로 로그인하면 자동으로 운영진 권한이 부여됩니다.
          </p>
        </div>
        <div>
          <label htmlFor={inputId} className="text-16 mb-2 block font-bold">
            GitHub 사용자명
          </label>
          <TextInput
            id={inputId}
            value={githubUsername}
            placeholder="예: octocat"
            onChange={(event) => {
              setGithubUsername(event.target.value);
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
            onClickHandler={handleClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button type="secondary" htmlType="submit" disabled={isSubmitting}>
            <PlusIcon className="h-4 w-4" />
            초대하기
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default InviteAdminModal;
