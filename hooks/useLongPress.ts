import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  threshold?: number;
  onLongPress: (e: any) => void;
  onClick?: (e: any) => void;
}

export function useLongPress({ threshold = 500, onLongPress, onClick }: UseLongPressOptions) {
  const [isLongPressActive, setIsLongPressActive] = useState(false);
  const timerRef = useRef<number | null>(null);
  const isCanceled = useRef(false);

  const start = useCallback(
    (e: any) => {
      isCanceled.current = false;
      const event = { ...e }; // Persist event for async use
      timerRef.current = window.setTimeout(() => {
        if (!isCanceled.current) {
          setIsLongPressActive(true);
          onLongPress(event);
        }
      }, threshold);
    },
    [onLongPress, threshold]
  );

  const stop = useCallback(
    (e: any) => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      if (!isLongPressActive && !isCanceled.current && onClick) {
        onClick(e);
      }
      setIsLongPressActive(false);
    },
    [isLongPressActive, onClick]
  );

  const cancel = useCallback(() => {
    isCanceled.current = true;
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
  }, []);

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: cancel,
    onTouchStart: start,
    onTouchEnd: stop,
    onTouchMove: cancel,
  };
}
