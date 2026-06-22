import { render } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import { useFocusTrap } from '@/hooks/use-focus-trap';

function TestComponent({ isActive }: { isActive: boolean }) {
  const ref = useFocusTrap(isActive);
  return React.createElement(
    'div',
    { ref, id: 'container' },
    React.createElement('button', { id: 'first-focusable' }, 'First'),
    React.createElement('input', { type: 'text', id: 'input-focusable' }),
    React.createElement('button', { id: 'last-focusable' }, 'Last')
  );
}

describe('useFocusTrap', () => {
  it('should not trap focus when inactive', () => {
    const { container } = render(React.createElement(TestComponent, { isActive: false }));
    const lastBtn = container.querySelector('#last-focusable') as HTMLButtonElement;

    lastBtn.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');

    lastBtn.dispatchEvent(event);
    expect(spy).not.toHaveBeenCalled();
  });

  it('should wrap focus to first element when Tab is pressed on last element', () => {
    const { container } = render(React.createElement(TestComponent, { isActive: true }));
    const firstBtn = container.querySelector('#first-focusable') as HTMLButtonElement;
    const lastBtn = container.querySelector('#last-focusable') as HTMLButtonElement;

    lastBtn.focus();
    expect(document.activeElement).toBe(lastBtn);

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');

    lastBtn.dispatchEvent(event);

    expect(spy).toHaveBeenCalled();
    expect(document.activeElement).toBe(firstBtn);
  });

  it('should wrap focus to last element when Shift+Tab is pressed on first element', () => {
    const { container } = render(React.createElement(TestComponent, { isActive: true }));
    const firstBtn = container.querySelector('#first-focusable') as HTMLButtonElement;
    const lastBtn = container.querySelector('#last-focusable') as HTMLButtonElement;

    firstBtn.focus();
    expect(document.activeElement).toBe(firstBtn);

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });
    const spy = vi.spyOn(event, 'preventDefault');

    firstBtn.dispatchEvent(event);

    expect(spy).toHaveBeenCalled();
    expect(document.activeElement).toBe(lastBtn);
  });

  it('should focus last element if active element is outside container during Shift+Tab', () => {
    const { container } = render(React.createElement(TestComponent, { isActive: true }));
    const lastBtn = container.querySelector('#last-focusable') as HTMLButtonElement;
    const mainContainer = container.querySelector('#container') as HTMLDivElement;

    // Focus an element outside container (body)
    document.body.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    });

    mainContainer.dispatchEvent(event);
    expect(document.activeElement).toBe(lastBtn);
  });

  it('should focus first element if active element is outside container during Tab', () => {
    const { container } = render(React.createElement(TestComponent, { isActive: true }));
    const firstBtn = container.querySelector('#first-focusable') as HTMLButtonElement;
    const mainContainer = container.querySelector('#container') as HTMLDivElement;

    document.body.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'Tab',
      bubbles: true,
      cancelable: true,
    });

    mainContainer.dispatchEvent(event);
    expect(document.activeElement).toBe(firstBtn);
  });

  it('should do nothing if key pressed is not Tab', () => {
    const { container } = render(React.createElement(TestComponent, { isActive: true }));
    const lastBtn = container.querySelector('#last-focusable') as HTMLButtonElement;

    lastBtn.focus();
    const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
    const spy = vi.spyOn(event, 'preventDefault');

    lastBtn.dispatchEvent(event);
    expect(spy).not.toHaveBeenCalled();
  });
});
