import { useRef, useEffect } from "react";

export default function useResizable(ref, callback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        try {
          callbackRef.current?.(entries[0].contentRect);
        } catch (err) {
          console.error(err);
        }
      });
    });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [ref.current]);
}
