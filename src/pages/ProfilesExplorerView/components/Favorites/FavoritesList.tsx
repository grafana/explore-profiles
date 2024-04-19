import { TimeRange } from '@grafana/data';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import React from 'react';

type FavoritesProps = {
  timeRange: TimeRange;
  services: Services;
};

function FavoritesListComponent({ timeRange, services }: FavoritesProps) {
  console.log('*** Favorites', timeRange, services);

  return (
    <>
      <em>Work-in-progress :)</em>
    </>
  );
}

export const FavoritesList = React.memo(FavoritesListComponent);
