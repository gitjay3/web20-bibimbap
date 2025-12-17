# Utils

전역에서 사용하는 유틸리티 함수를 관리합니다.

## 작성 규칙

- **순수 함수만 작성**합니다. (동일한 입력에 대해 항상 동일한 출력)
- 사이드 이펙트가 없어야 합니다.
- 단일 책임 원칙을 따릅니다.
- 테스트 가능하도록 작성합니다.

## 예시

```ts
// formatDate.ts
export const formatDate = (date: Date, format: string = 'YYYY-MM-DD'): string => {
  // 날짜 포맷팅 로직
  return formattedDate;
};

// validation.ts
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```
