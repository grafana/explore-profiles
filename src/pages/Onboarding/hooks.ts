import { useEffect, useState } from 'react';
import { useAppSelector } from '@pyroscope/redux/hooks';
import { selectAppNamesState } from '@pyroscope/redux/reducers/continuous';
import { useSelectFirstApp } from 'grafana-pyroscope/public/app/hooks/useAppNames';

type DataPresentCheckResult = {
  /** True if we are still waiting to determine whether or not data is present.  */
  waiting: boolean;
  /** True only if we have finished waiting AND determined that there is no data present. */
  determinedNoDataPresent: boolean;
  /** True if the attempt to load failed */
  error: boolean;
};

/** Determine if there is data present (or if we are waiting to find out) */
export function useDataPresentCheck(): DataPresentCheckResult {
  // This hook needs to be used under the PLuginPropsContextProvider
  const { type: loadingState, data } = useAppSelector(selectAppNamesState);

  useSelectFirstApp();

  const [firstLoadState, setFirstLoadState] = useState<'initial' | 'first_reload' | 'loaded'>();
  useEffect(() => {
    // The `loadingState (type)` obtained from selectAppNamesState only has one `reloading` state, so this
    // effect helps us differentiate between the very first `reloading`, so we can ignore subsequent `reloading`.
    // We store what state of reloading by calling `setFirstLoadState`
    if (firstLoadState === 'loaded') {
      return;
    } else if (firstLoadState === undefined && loadingState === 'loaded') {
      setFirstLoadState('initial');
    } else if (firstLoadState === 'initial' && loadingState === 'reloading') {
      setFirstLoadState('first_reload');
    } else if (firstLoadState === 'first_reload' && (loadingState === 'loaded' || loadingState === 'failed')) {
      setFirstLoadState('loaded'); // Terminal state
    }
  }, [loadingState, firstLoadState]);

  const waiting = firstLoadState !== 'loaded';
  const determinedNoDataPresent = firstLoadState === 'loaded' && data.length <= 0;
  const error = loadingState === 'failed';

  return { waiting, determinedNoDataPresent, error };
}
