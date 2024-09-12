/**
 * This is the same use react-use: usePrevious()
 * If more react-use like hooks are needed, we can consider adding react-use as a dependency
 */
import { useEffect, useRef } from 'react';

export function usePrevious<T>(state: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = state;
  });

  return ref.current;
}
