import GithubIcon from '@/assets/icons/github.svg?react';
import PageMeta from '@/components/PageMeta';

export default function LoginPage() {
  const handleGithubLogin = () => {
    window.location.href = '/api/auth/github';
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-4">
      <PageMeta
        title="로그인"
        description="Bookstcamp에 로그인하여 소속 조직의 이벤트를 확인하고 예약을 관리하세요."
      />
      <div className="flex w-full max-w-80 flex-col items-center gap-10">
        <div className="flex flex-col items-center gap-5">
          <img className="h-24 w-24" src="/logo.webp" alt="로고" />

          <h1 className="text-neutral-text-primary text-36 font-extrabold">bookstcamp</h1>

          <p className="text-neutral-text-secondary text-16 text-center font-medium">
            부스트캠프 멤버들을 위한 예약 시스템
          </p>
        </div>

        <button
          type="button"
          onClick={handleGithubLogin}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-black text-sm font-bold text-white hover:bg-black/90"
        >
          <GithubIcon className="h-4 w-4" />
          GitHub로 계속하기
        </button>

        <div className="text-neutral-text-tertiary text-xs font-medium">
          © 2026 bookstcamp. All rights reserved.
        </div>
      </div>
    </main>
  );
}
