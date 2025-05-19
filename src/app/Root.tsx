import React, { Suspense } from 'react';

const LazyApp = React.lazy(() => import('./App').then((module) => ({ default: module.App })));

export function Root() {
  return (
    <Suspense>
      <LazyApp />
    </Suspense>
  );
}
