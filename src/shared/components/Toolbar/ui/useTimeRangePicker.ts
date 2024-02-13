import { useCallback } from 'react';

import { useTimeRangeFromUrl } from '../../../domain/url-params/useTimeRangeFromUrl';

export function useTimeRangePicker() {
  const [timeRange, setTimeRange] = useTimeRangeFromUrl();

  const zoom = useCallback(() => {
    const { from, to } = timeRange;
    const halfDiff = to.diff(from) / 2;

    // These are mutable...
    from.subtract(halfDiff);
    to.add(halfDiff);

    setTimeRange({ from, to, raw: { from, to } });
  }, [timeRange, setTimeRange]);

  const navigate = useCallback(
    (forward = true) => {
      const { from, to } = timeRange;
      const multiplier = forward ? +1 : -1;
      const halfDiff = (to.diff(from) / 2) * multiplier;

      // These are mutable...
      from.add(halfDiff);
      to.add(halfDiff);

      setTimeRange({ from, to, raw: { from, to } });
    },
    [timeRange, setTimeRange]
  );

  return {
    timeRange,
    setTimeRange,
    zoom,
    navigate,
  };
}
