import { PageName, reportInteraction } from '@shared/domain/reportInteraction';
import { useEffect, useState } from 'react';

export function useReportPageInitialized(page: PageName) {
  const [initialized, setInitialized] = useState(false);
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      reportInteraction('g_pyroscope_app_page_initialized', { page });
    }
  }, [page, initialized]);
}
