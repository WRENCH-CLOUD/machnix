import { useEffect, useState } from "react";

/**
 * Persist React state to localStorage with optional runtime validation.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  validate?: (value: unknown) => value is T
) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue === null) {
        return initialValue;
      }

      let parsedValue: unknown = storedValue;
      try {
        parsedValue = JSON.parse(storedValue);
      } catch {
        // Backward compatibility for values previously stored as plain strings.
        parsedValue = storedValue;
      }

      if (validate && !validate(parsedValue)) {
        return initialValue;
      }

      return parsedValue as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      // Ignore write failures (private mode/quota) and keep in-memory state.
    }
  }, [key, state]);

  return [state, setState] as const;
}
