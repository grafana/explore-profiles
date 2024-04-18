import { setupReduxQuerySync } from '@pyroscope/redux/useReduxQuerySync';
import { useEffect, useRef } from 'react';

// TODO: TEMP until finishing the Pyroscope OSS migration
function shouldSetupReduxQuerySync() {
  return [
    '/a/grafana-pyroscope-app/settings',
    '/a/grafana-pyroscope-app/ad-hoc',
    '/a/grafana-pyroscope-app/single',
    // TODO Pyroscope OSS migration: add new paths below
    '/a/grafana-pyroscope-app/profiles-explorer',
  ].includes(window.location.pathname);
}
export function useSetupReduxQuerySync() {
  const unsubscribeRef = useRef<unknown>(null);

  // disable Redux in migrated pages
  if (!shouldSetupReduxQuerySync() && !unsubscribeRef.current) {
    // we have to register as soon as possible to prevent loading apps before having parsed the URL parameters
    // we do this here and not at the top-level module scope so we can enable the plugin to be preloaded without setting history listeners,
    // which could cause conflicts with other parts of the platform or plugins
    unsubscribeRef.current = setupReduxQuerySync();
  }

  useEffect(
    () => () => {
      if (typeof unsubscribeRef.current === 'function') {
        // leave no trace when navigating outside of the plugin pages (see https://github.com/grafana/pyroscope-app-plugin/issues/171)
        unsubscribeRef.current();
      }
    },
    []
  );
}
