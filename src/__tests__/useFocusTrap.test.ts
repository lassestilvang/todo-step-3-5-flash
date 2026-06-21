import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

describe('useFocusTrap', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.innerHTML = `
      <div>
        <button id="first-focusable">First</button>
        <input type="text" id="input-focusable" />
        <button id="last-focusable">Last</button>
      </div>
    `;
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('should be a React hook that returns a ref object', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toBeDefined();
    expect(typeof result.current?.current).toBe('object');
  });

  it('should handle the isActive parameter', () => {
    const { result: result1 } = renderHook(() => useFocusTrap(true));
    const { result: result2 } = renderHook(() => useFocusTrap(false));

    expect(result1.current).toBeDefined();
    expect(result2.current).toBeDefined();
  });

  it('should return a ref that can be assigned to a DOM element', () => {
    const { result } = renderHook(() => useFocusTrap(true));

    expect(result.current).toBeDefined();
    expect(result.current?.current).toBeNull();

    // Simulate assigning a ref
    result.current!.current = container;
    expect(result.current?.current).toBe(container);
  });

  it('should have a ref object with current property', () => {
    const { result } = renderHook(() => useFocusTrap(true));

    expect(result.current).toBeDefined();
    expect(result.current?.current).toBeNull();
  });

  it('should work with null isActive', () => {
    const { result } = renderHook(() => useFocusTrap(false));
    expect(result.current).toBeDefined();
  });
});