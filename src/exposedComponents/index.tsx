import React, { lazy, Suspense } from 'react';

import { EmbeddedProfilesExplorationState } from './types';

const EmbeddedProfilesExploration = lazy(() => import('./EmbeddedProfilesExploration/EmbeddedProfilesExploration'));

export function SuspendedEmbeddedProfilesExploration(props: EmbeddedProfilesExplorationState) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EmbeddedProfilesExploration {...props} />
    </Suspense>
  );
}
