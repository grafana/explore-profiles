import { Trans } from '@grafana/i18n';
import { OpenFeaturePluginScope } from '@shared/infrastructure/featureFlags/openFeature';
import React, { lazy, Suspense } from 'react';

import { EmbeddedProfilesExplorationState } from './types';

const EmbeddedProfilesExploration = lazy(() => import('./EmbeddedProfilesExploration/EmbeddedProfilesExploration'));

export function SuspendedEmbeddedProfilesExploration(props: EmbeddedProfilesExplorationState) {
  return (
    <OpenFeaturePluginScope>
      <Suspense
        fallback={
          <div>
            <Trans i18nKey="exposed-components.loading">Loading...</Trans>
          </div>
        }
      >
        <EmbeddedProfilesExploration {...props} />
      </Suspense>
    </OpenFeaturePluginScope>
  );
}
