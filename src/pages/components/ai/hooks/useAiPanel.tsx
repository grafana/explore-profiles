import { useCallback, useEffect, useState } from 'react';

export function useAiPanel(query: string, from: string, until: string) {
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  useEffect(() => {
    setIsAiPanelOpen(false);
  }, [query, from, until]);

  const onClickAskAi = useCallback(() => {
    setIsAiPanelOpen(true);
  }, []);

  const onClickCloseAiPanel = useCallback(() => {
    setIsAiPanelOpen(false);
  }, []);

  return { isAiPanelOpen, onClickAskAi, onClickCloseAiPanel };
}
