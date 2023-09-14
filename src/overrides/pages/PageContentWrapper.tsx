import React, { ReactNode } from 'react';

// import { PageContentWrapper as Original} from 'grafana-pyroscope/public/app/pages/layout';
export function PageContentWrapper({ children }: { children: ReactNode }) {
  // Just pass through. No styled div.
  return children;
}
