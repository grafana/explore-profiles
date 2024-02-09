import { useEffect, useState } from 'react';

export function useTimezone() {
  const offset = new Date().getTimezoneOffset();
  const [timezone, setTimezone] = useState<'utc' | 'browser'>(offset === 0 ? 'utc' : 'browser');

  useEffect(() => {
    setTimezone(offset === 0 ? 'utc' : 'browser');
  }, [offset]);

  return timezone;
}
