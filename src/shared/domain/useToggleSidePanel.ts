import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useEffect, useState } from 'react';

type PanelId = 'ai' | 'function-details' | null;

type OnOpenHandler = () => void;

export type SidePanel = {
  onOpen: (handler: OnOpenHandler) => void;
  isOpen: (panelId: PanelId) => boolean;
  open: (panelId: PanelId) => void;
  close: () => void;
};

export function useToggleSidePanel(): SidePanel {
  const [query] = useQueryFromUrl();
  const [timeRange] = useTimeRangeFromUrl();
  const [openPanelId, setOpenPanelId] = useState<PanelId>(null);
  const [onOpenHandler, setOnOpenHandler] = useState<OnOpenHandler>();

  // TOOD: better alternative - add callback props on <Toolbar />
  useEffect(() => {
    setOpenPanelId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, timeRange.raw.from.toString(), timeRange.raw.to.toString()]);

  return {
    onOpen(handler: OnOpenHandler) {
      setOnOpenHandler(handler);
    },
    isOpen(panelId: PanelId) {
      return panelId === openPanelId;
    },
    open(panelId: PanelId) {
      setOpenPanelId(panelId);
      onOpenHandler?.();
    },
    close() {
      setOpenPanelId(null);
    },
  };
}
