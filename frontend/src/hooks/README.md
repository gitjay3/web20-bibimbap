# Hooks

전역에서 공통으로 사용하는 커스텀 훅을 관리합니다.

## 작성 규칙

- Hook의 이름은 `use`로 시작합니다.
- React의 Hook 규칙을 따릅니다.
- 재사용 가능한 로직을 캡슐화합니다.
- 하나의 책임만 가지도록 설계합니다.

## 예시

```ts
// useDebounce.ts
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

// useLocalStorage.ts
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  // localStorage 관리 로직
  return [storedValue, setValue];
};
```
