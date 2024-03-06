import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useEffect, useState } from 'react';

export function useToggleSidePanel() {
  const [query] = useQueryFromUrl();
  const [timeRange] = useTimeRangeFromUrl();
  const [isOpen, seIsOpen] = useState(false);

  useEffect(() => {
    seIsOpen(false);
  }, [query, timeRange]);

  return {
    isOpen,
    open() {
      seIsOpen(true);
    },
    close() {
      seIsOpen(false);
    },
  };
}
