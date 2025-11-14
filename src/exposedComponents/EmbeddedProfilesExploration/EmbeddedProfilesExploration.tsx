import { SceneTimeRange, sceneUtils, UrlSyncContextProvider } from '@grafana/scenes';
import { queryClient } from '@shared/infrastructure/react-query/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';
import { SceneProfilesExplorer } from 'src/pages/ProfilesExplorerView/components/SceneProfilesExplorer/SceneProfilesExplorer';

import { EmbeddedProfilesExplorationState } from '../types';

function buildProfilesExplorationFromState({
  initialTimeRange,
  onTimeRangeChange,
  initialFilters,
  initialDS,
}: EmbeddedProfilesExplorationState) {
  const $timeRange = new SceneTimeRange({
    value: initialTimeRange,
    from: initialTimeRange.raw.from.toString(),
    to: initialTimeRange.raw.to.toString(),
  });

  $timeRange.subscribeToState((state) => {
    if (onTimeRangeChange) {
      onTimeRangeChange(state.value);
    }
  });

  const exploration = new SceneProfilesExplorer({
    $timeRange,
    isEmbedded: true,
    initialFilters: initialFilters ? initialFilters.map((filter) => ({ ...filter })) : undefined,
    initialDS,
  });

  const params = new URLSearchParams(window.location.search);
  sceneUtils.syncStateFromSearchParams(exploration, params);

  return exploration;
}

export default function EmbeddedProfilesExploration(props: EmbeddedProfilesExplorationState) {
  const [exploration] = useState(buildProfilesExplorationFromState(props));

  return (
    <UrlSyncContextProvider namespace="pd" scene={exploration} updateUrlOnInit={false} createBrowserHistorySteps={true}>
      <QueryClientProvider client={queryClient}>
        <exploration.Component model={exploration} />
      </QueryClientProvider>
    </UrlSyncContextProvider>
  );
}
