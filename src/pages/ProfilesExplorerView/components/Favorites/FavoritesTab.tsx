import { TimeRange } from '@grafana/data';
import React from 'react';

type FavoritesProps = {
  timeRange: TimeRange;
};

function FavoritesTabComponent({ timeRange }: FavoritesProps) {
  console.log('*** Favorites', timeRange);

  return (
    <>
      <em>Work-in-progress :)</em>
    </>
  );
}

export const FavoritesTab = React.memo(FavoritesTabComponent);
