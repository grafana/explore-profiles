import { SceneTimeRange, sceneUtils, UrlSyncContextProvider } from '@grafana/scenes';
import { ErrorBoundaryAlert } from '@grafana/ui';
import { DataSourceUidFallback } from '@shared/infrastructure/datasource/DataSourceUidFallback';
import { useDefaultDataSourceUid } from '@shared/infrastructure/datasource/useDefaultDataSourceUid';
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

interface EmbeddedSceneProps extends EmbeddedProfilesExplorationState {
  initialDS: string;
}

function EmbeddedScene(props: EmbeddedSceneProps) {
  const [exploration] = useState(() => buildProfilesExplorationFromState(props));

  return (
    <UrlSyncContextProvider namespace="pd" scene={exploration} updateUrlOnInit={false} createBrowserHistorySteps={true}>
      <exploration.Component model={exploration} />
    </UrlSyncContextProvider>
  );
}

export default function EmbeddedProfilesExploration(props: EmbeddedProfilesExplorationState) {
  const dataSourceState = useDefaultDataSourceUid({ selectedUid: props.initialDS });
  const { uid } = dataSourceState;

  if (!uid) {
    return <DataSourceUidFallback dataSourceState={dataSourceState} />;
  }

  return (
    <ErrorBoundaryAlert>
      <QueryClientProvider client={queryClient}>
        <EmbeddedScene {...props} initialDS={uid} />
      </QueryClientProvider>
    </ErrorBoundaryAlert>
  );
}
