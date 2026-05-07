import { Trans } from '@grafana/i18n';
import { OpenFeaturePluginScope } from '@shared/infrastructure/featureFlags/openFeature';
import React, { lazy, Suspense } from 'react';

import pluginJson from '../plugin.json';
import { EmbeddedProfilesExplorationState } from './types';

/** Same sequencing as `app/Root.tsx` — embedded extensions skip the root page, so we init locales before the chunk runs `t()`. */
const EmbeddedProfilesExploration = lazy(async () => {
  const { initPluginTranslations } = await import('@grafana/i18n');

  const { loadResources: scenesLoadResources } = await import('@grafana/scenes');
  await initPluginTranslations('grafana-scenes', [scenesLoadResources]);

  const { loadResources } = await import('../i18n/loadResources');
  await initPluginTranslations(pluginJson.id, [loadResources]);

  return import('./EmbeddedProfilesExploration/EmbeddedProfilesExploration');
});

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
