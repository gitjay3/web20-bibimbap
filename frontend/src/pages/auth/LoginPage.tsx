import { useState } from 'react';
import GithubIcon from '@/assets/icons/github.svg?react';
import { adminLogin } from '@/api/auth';

const SHOW_INTERNAL_LOGIN = import.meta.env.VITE_SHOW_INTERNAL_LOGIN === 'true';
// TODO : 나중에 로그인 방식 확정되면 지우고 github으로 수정
export default function LoginPage() {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleGithubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  const handleAdminLogin = () => {
    setIsAdminLogin(true);
  };

  const handleCancelAdminLogin = () => {
    setIsAdminLogin(false);
    setId('');
    setPassword('');
    setIsLoading(false);
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setIsLoading(true);

    try {
      await adminLogin({ id, password });
      window.location.href = '/';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-5">
          <img className="h-24 w-24" src="/logo.webp" alt="로고" />

          <h1 className="text-neutral-text-primary text-36 font-extrabold">bookstcamp</h1>

          <p className="text-neutral-text-secondary text-16 text-center font-medium">
            부스트캠프 멤버들을 위한 예약 시스템
          </p>
        </div>

        {!isAdminLogin ? (
          <div className="flex w-full flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleGithubLogin}
              className="flex h-12 w-80 items-center justify-center gap-2 rounded-lg bg-black text-sm font-bold text-white hover:bg-black/90"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub로 계속하기
            </button>

            {SHOW_INTERNAL_LOGIN && (
              <>
                <div className="flex w-80 items-center gap-2.5">
                  <div className="bg-neutral-text-tertiary h-px flex-1" />
                  <span className="text-neutral-text-tertiary text-xs font-medium">OR</span>
                  <div className="bg-neutral-text-tertiary h-px flex-1" />
                </div>

                <button
                  type="button"
                  onClick={handleAdminLogin}
                  className="border-neutral-border-default text-neutral-text-secondary hover:bg-neutral-surface-default h-12 w-80 rounded-lg border bg-white text-sm font-bold"
                >
                  운영진 로그인
                </button>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} className="flex w-80 flex-col gap-3">
            <input
              type="text"
              placeholder="아이디"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="border-neutral-border-default h-12 rounded-lg border px-4 text-sm"
              required
              disabled={isLoading}
              autoComplete="username"
            />

            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-neutral-border-default h-12 rounded-lg border px-4 text-sm"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />

            <button
              type="submit"
              className="h-12 rounded-lg bg-black text-sm font-bold text-white hover:bg-black/90"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>

            <button
              type="button"
              onClick={handleCancelAdminLogin}
              className="text-neutral-text-tertiary hover:text-neutral-text-secondary text-sm font-medium"
              disabled={isLoading}
            >
              취소
            </button>
          </form>
        )}

        <div className="text-neutral-text-tertiary text-xs font-medium">
          © 2026 bookstcamp. All rights reserved.
        </div>
      </div>
    </div>
  );
}
