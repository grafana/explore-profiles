import { config } from '@grafana/runtime';
import React, { Suspense } from 'react';
import { lt } from 'semver';

import pluginJson from '../plugin.json';

const LazyApp = React.lazy(async () => {
  const { initPluginTranslations } = await import('@grafana/i18n');

  const { loadResources: scenesLoadResources } = await import('@grafana/scenes');
  await initPluginTranslations('grafana-scenes', [scenesLoadResources]);

  const { loadResources } = await import('../i18n/loadResources');
  const pluginLoaders = lt(config?.buildInfo?.version || '0.0.0', '12.1.0') ? [loadResources] : [];
  await initPluginTranslations(pluginJson.id, pluginLoaders);

  return import('./App').then((module) => ({ default: module.App }));
});

export function Root() {
  return (
    <Suspense>
      <LazyApp />
    </Suspense>
  );
}
