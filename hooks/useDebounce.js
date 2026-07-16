import { useRef, useEffect } from "react";

function useDebounce(callback, delay, leading = false) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef();

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, [delay]);

  const debouncedFunction = (...args) => {
    if (leading && !timeoutRef.current) {
      callbackRef.current(...args);
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  };

  return debouncedFunction;
}

export default useDebounce;
