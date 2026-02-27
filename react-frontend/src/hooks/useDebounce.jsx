import { useRef, useState, useCallback } from "react";

export function useDebouncedState(initialValue, delay = 300) {
  const [state, setState] = useState(initialValue);
  const timeoutRef = useRef(null);

  const setDebouncedState = useCallback(
    (value) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setState(value);
      }, delay);
    },
    [delay]
  );

  return [state, setDebouncedState];
}
