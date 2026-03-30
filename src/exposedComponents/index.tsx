import { Trans } from '@grafana/i18n';
import React, { lazy, Suspense } from 'react';

import { EmbeddedProfilesExplorationState } from './types';

const EmbeddedProfilesExploration = lazy(() => import('./EmbeddedProfilesExploration/EmbeddedProfilesExploration'));

export function SuspendedEmbeddedProfilesExploration(props: EmbeddedProfilesExplorationState) {
  return (
    <Suspense
      fallback={
        <div>
          <Trans i18nKey="exposed-components.loading">Loading...</Trans>
        </div>
      }
    >
      <EmbeddedProfilesExploration {...props} />
    </Suspense>
  );
}
