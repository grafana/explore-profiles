import { FieldColor } from '@grafana/data';
import {
  SceneComponentProps,
  SceneCSSGridItem,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  VizPanel,
} from '@grafana/scenes';
import { Button } from '@grafana/ui';
import React from 'react';

import { Favorite } from '../../FavAction';
import { SceneFavorites } from '../SceneFavorites';

interface SelectFavoriteActionState extends SceneObjectState {
  favorite: Favorite;
}

export class SelectFavoriteAction extends SceneObjectBase<SelectFavoriteActionState> {
  public onClick = () => {
    // TODO: use a key on the panel and deal with it in SceneFavorites?
    const gridItem = sceneGraph.getAncestor(this, SceneCSSGridItem);
    const timeseriesPanel = gridItem.state.body as VizPanel;
    const color = (timeseriesPanel.state.fieldConfig.defaults.color as FieldColor).fixedColor as string;

    sceneGraph.getAncestor(this, SceneFavorites).selectFavorite(this.state.favorite, color);
  };

  public static Component = ({ model }: SceneComponentProps<SelectFavoriteAction>) => {
    return (
      <Button variant="primary" size="sm" fill="text" onClick={model.onClick}>
        Select
      </Button>
    );
  };
}
