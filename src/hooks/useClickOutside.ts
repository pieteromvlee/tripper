import { useEffect, useRef, RefObject } from 'react';

/**
 * Custom hook to handle clicks outside a referenced element
 *
 * @param ref - React ref object pointing to the element to detect clicks outside of
 * @param handler - Callback function to execute when a click outside is detected
 * @param enabled - Whether the click outside detection is active (default: true)
 *
 * Note: The handler function is stored in a ref to prevent unnecessary effect re-runs
 * when the handler changes. This ensures the event listener is only added/removed
 * when enabled or ref changes, not on every render.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement>,
  handler: () => void,
  enabled: boolean = true
) {
  // Store handler in a ref so it doesn't cause effect re-runs
  const handlerRef = useRef(handler);

  // Update ref when handler changes
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!enabled) return;

    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handlerRef.current();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [ref, enabled]);
}
