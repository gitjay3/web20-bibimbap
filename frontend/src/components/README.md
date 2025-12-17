# Components

여러 기능에서 공용으로 사용하는 프레젠테이셔널 컴포넌트를 관리합니다.

## 작성 규칙

- 비즈니스 로직을 포함하지 않습니다.
- Props를 통해 데이터를 전달받습니다.
- 재사용 가능하도록 설계합니다.
- 스타일은 컴포넌트와 함께 관리합니다.

## 예시

```tsx
// Button.tsx
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {label}
    </button>
  );
};
```
