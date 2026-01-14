import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import useOutsideClick from './useOutsideClick';

describe('useOutsideClick', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('요소 외부 클릭 시 콜백을 호출한다', () => {
    const callback = vi.fn();

    const targetElement = document.createElement('div');
    container.appendChild(targetElement);

    const outsideElement = document.createElement('div');
    container.appendChild(outsideElement);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement);
      useOutsideClick(ref, callback);
      return ref;
    });

    const event = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
    });
    outsideElement.dispatchEvent(event);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('요소 내부 클릭 시 콜백을 호출하지 않는다', () => {
    const callback = vi.fn();

    const targetElement = document.createElement('div');
    container.appendChild(targetElement);

    renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement);
      useOutsideClick(ref, callback);
      return ref;
    });

    const event = new MouseEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
    });
    targetElement.dispatchEvent(event);

    expect(callback).not.toHaveBeenCalled();
  });

  it('언마운트 시 이벤트 리스너를 정리한다', () => {
    const callback = vi.fn();
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const targetElement = document.createElement('div');
    container.appendChild(targetElement);

    const { unmount } = renderHook(() => {
      const ref = useRef<HTMLDivElement>(targetElement);
      useOutsideClick(ref, callback);
      return ref;
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'pointerdown',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });
});
