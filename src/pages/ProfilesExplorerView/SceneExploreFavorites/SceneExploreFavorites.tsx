import { EmbeddedSceneState, SceneComponentProps, SceneCSSGridItem, SceneObjectBase, VizPanel } from '@grafana/scenes';
import { Drawer } from '@grafana/ui';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SelectAction } from '../actions/SelectAction';
import { SceneTimeSeriesGrid } from '../components/SceneTimeSeriesGrid';
import { PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE } from '../data/pyroscope-data-sources';
import { EventExpandPanel } from '../events/EventExpandPanel';
import { EventViewServiceFlameGraph } from '../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../events/EventViewServiceLabels';
import { findSceneObjectByKey } from '../helpers/findSceneObjectByKey';
import { GridItemData } from '../types/GridItemData';

interface SceneExploreFavoritesState extends EmbeddedSceneState {
  drawerContent?: VizPanel;
  drawerTitle?: string;
  drawerSubtitle?: string;
}

export class SceneExploreFavorites extends SceneObjectBase<SceneExploreFavoritesState> {
  constructor() {
    super({
      key: 'explore-favorites',
      body: new SceneTimeSeriesGrid({
        key: 'favorites-grid',
        dataSource: PYROSCOPE_PROFILE_FAVORIES_DATA_SOURCE,
        headerActions: (item) => [
          new SelectAction({ EventClass: EventViewServiceLabels, item }),
          new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
          new SelectAction({ EventClass: EventExpandPanel, item }),
          new FavAction({ item }),
        ],
      }),
      drawerContent: undefined,
      drawerTitle: undefined,
      drawerSubtitle: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const expandPanelSub = this.subscribeToEvent(EventExpandPanel, async (event) => {
      this.openExpandedPanelDrawer(event.payload.item);
    });

    return () => {
      expandPanelSub.unsubscribe();
    };
  }

  openExpandedPanelDrawer(item: GridItemData) {
    const timeSeriesPanel = (
      findSceneObjectByKey(this, SceneTimeSeriesGrid.buildGridItemKey(item)) as SceneCSSGridItem
    ).state.body!.clone() as VizPanel;

    timeSeriesPanel.setState({
      // TS: we should be thorough and use all action types (FavAction as well) but it's good enough for what we want to do here
      headerActions: (timeSeriesPanel.state.headerActions as SelectAction[]).filter(
        (action) => !(action.state.EventClass instanceof EventExpandPanel)
      ),
    });

    this.setState({
      drawerTitle: item.label,
      drawerSubtitle: '',
      drawerContent: timeSeriesPanel as VizPanel,
    });
  }

  closeDrawer = () => {
    this.setState({ drawerContent: undefined, drawerTitle: undefined, drawerSubtitle: undefined });
  };

  static Component({ model }: SceneComponentProps<SceneExploreFavorites>) {
    const { body, drawerContent, drawerTitle, drawerSubtitle } = model.useState();

    return (
      <>
        <body.Component model={body} />

        {drawerContent && (
          <Drawer size="lg" title={drawerTitle} subtitle={drawerSubtitle} closeOnMaskClick onClose={model.closeDrawer}>
            <drawerContent.Component model={drawerContent} />
          </Drawer>
        )}
      </>
    );
  }
}
