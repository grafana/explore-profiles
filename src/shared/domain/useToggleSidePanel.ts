import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useEffect, useState } from 'react';

type PanelId = 'ai' | 'function-details' | null;

export function useToggleSidePanel() {
  const [query] = useQueryFromUrl();
  const [timeRange] = useTimeRangeFromUrl();
  const [openPanelId, setOpenPanelId] = useState<PanelId>(null);

  // TOOD: better alternative - add callback props on <Toolbar />
  useEffect(() => {
    setOpenPanelId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, timeRange.raw.from.toString(), timeRange.raw.to.toString()]);

  return {
    isOpen(panelId: PanelId) {
      return panelId === openPanelId;
    },
    open(panelId: PanelId) {
      setOpenPanelId(panelId);
    },
    close() {
      setOpenPanelId(null);
    },
  };
}
