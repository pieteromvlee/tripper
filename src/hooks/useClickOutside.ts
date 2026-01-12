import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

/**
 * Custom hook to handle clicks outside a referenced element
 *
 * The handler is stored in a ref to prevent unnecessary effect re-runs
 * when the handler changes. This ensures the event listener is only
 * added/removed when enabled changes, not on every render.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  enabled: boolean = true
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!enabled) return;

    function handleClickOutside(event: MouseEvent): void {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handlerRef.current();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, enabled]);
}
