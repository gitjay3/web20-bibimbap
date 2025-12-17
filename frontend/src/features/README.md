# Features

FSD(Feature-Sliced Design) 기반으로 각 기능을 독립적인 모듈로 관리합니다.

## 구조

각 기능은 다음과 같은 내부 구조를 가집니다:

```
features/
  ├── feature-name/
  │   ├── ui/           # UI 컴포넌트
  │   ├── model/        # 상태 관리 및 비즈니스 로직
  │   ├── api/          # API 호출 함수
  │   ├── types/        # 타입 정의
  │   └── index.ts      # Public API
```

## 작성 규칙

- 각 기능은 독립적으로 동작해야 합니다.
- 기능 간 의존성은 최소화합니다.
- 외부에서는 `index.ts`를 통해서만 접근합니다.
