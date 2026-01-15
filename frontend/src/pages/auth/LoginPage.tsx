import { useState } from 'react';
import GithubIcon from '@/assets/icons/github.svg?react';

export default function LoginPage() {
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');

  const handleGithubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  const handleAdminLogin = () => {
    setIsAdminLogin(true);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 운영진 로그인 API 연동
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
              className="flex h-12 w-80 items-center justify-center gap-2 rounded-lg bg-black text-sm font-bold text-white"
            >
              <GithubIcon className="h-4 w-4" />
              GitHub로 계속하기
            </button>

            <div className="flex w-80 items-center gap-2.5">
              <div className="bg-neutral-text-tertiary h-px flex-1" />
              <span className="text-neutral-text-tertiary text-xs font-medium">OR</span>
              <div className="bg-neutral-text-tertiary h-px flex-1" />
            </div>

            <button
              type="button"
              onClick={handleAdminLogin}
              className="border-neutral-border-default text-neutral-text-secondary h-12 w-80 rounded-lg border bg-white text-sm font-bold"
            >
              운영진 로그인
            </button>
          </div>
        ) : (
          <form onSubmit={handleAdminSubmit} className="flex w-80 flex-col gap-3">
            <input
              type="text"
              placeholder="아이디"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="border-neutral-border-default h-12 rounded-lg border px-4 text-sm"
            />

            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-neutral-border-default h-12 rounded-lg border px-4 font-sans text-sm"
            />

            <button type="submit" className="h-12 rounded-lg bg-black text-sm font-bold text-white">
              로그인
            </button>

            <button
              type="button"
              onClick={() => setIsAdminLogin(false)}
              className="text-neutral-text-tertiary text-sm font-medium"
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
