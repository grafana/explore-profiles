import { TimeRange } from '@grafana/data';
import React from 'react';

import { SceneFavorites } from './SceneFavorites';

type FavoritesProps = {
  timeRange: TimeRange;
};

function FavoritesTabComponent({ timeRange }: FavoritesProps) {
  const profilesScene = new SceneFavorites(timeRange);

  return <profilesScene.Component model={profilesScene} />;
}

export const FavoritesTab = React.memo(FavoritesTabComponent);
