import { localeCompare } from '@shared/domain/localeCompare';

import { FavAction } from '../../..//domain/actions/FavAction';
import { FavoritesDataSource } from '../../../infrastructure/favorites/FavoritesDataSource';
import { GridItemData } from '../types/GridItemData';

export const sortFavGridItems: (a: GridItemData, b: GridItemData) => number = function (a, b) {
  const aIsFav = FavoritesDataSource.exists(FavAction.buildFavorite(a));
  const bIsFav = FavoritesDataSource.exists(FavAction.buildFavorite(b));

  if (aIsFav && bIsFav) {
    return localeCompare(a.label, b.label);
  }

  if (bIsFav) {
    return +1;
  }

  if (aIsFav) {
    return -1;
  }

  return 0;
};
