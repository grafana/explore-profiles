import {
  EmbeddedSceneState,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneVariableSet,
} from '@grafana/scenes';
import React from 'react';

import { PanelType } from '../../components/SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneDrawer } from '../../components/SceneDrawer';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventExpandPanel } from '../../domain/events/EventExpandPanel';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../domain/events/EventViewServiceLabels';
import { FavoriteVariable } from '../../domain/variables/FavoriteVariable';
import { SceneLayoutSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { SceneNoDataSwitcher } from '../SceneByVariableRepeaterGrid/components/SceneNoDataSwitcher';
import { SceneQuickFilter } from '../SceneByVariableRepeaterGrid/components/SceneQuickFilter';
import { SceneLabelValuesBarGauge } from '../SceneLabelValuesBarGauge';
import { SceneLabelValuesTimeseries } from '../SceneLabelValuesTimeseries';

interface SceneExploreFavoritesState extends EmbeddedSceneState {
  drawer: SceneDrawer;
}

export class SceneExploreFavorites extends SceneObjectBase<SceneExploreFavoritesState> {
  constructor() {
    super({
      key: 'explore-favorites',
      $variables: new SceneVariableSet({ variables: [new FavoriteVariable()] }),
      body: new SceneByVariableRepeaterGrid({
        key: 'favorites-grid',
        variableName: 'favorite',
        mapOptionToItem: (option) => {
          // see FavoritesDataSource.ts
          const { index, value, panelType, queryRunnerParams } = JSON.parse(option.value as string);

          return {
            index,
            value,
            label: option.label,
            queryRunnerParams,
            panelType,
          };
        },
        sortItemsFn: (a, b) => a.label.localeCompare(b.label),
        headerActions: (item) => {
          const actions: Array<SelectAction | FavAction> = [
            new SelectAction({ EventClass: EventViewServiceLabels, item, skipVariablesInterpolation: true }),
            new SelectAction({ EventClass: EventViewServiceFlameGraph, item, skipVariablesInterpolation: true }),
          ];

          if (item.queryRunnerParams.groupBy) {
            actions.push(
              new SelectAction({
                EventClass: EventExpandPanel,
                item,
                tooltip: () => 'Expand this panel to view all the data',
                skipVariablesInterpolation: true,
              })
            );
          }

          actions.push(new FavAction({ item, skipVariablesInterpolation: true }));

          return actions;
        },
      }),
      drawer: new SceneDrawer(),
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const quickFilter = sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter);
    quickFilter.setPlaceholder('Search favorites (comma-separated regexes are supported)');

    const expandPanelSub = this.subscribeToEvent(EventExpandPanel, async (event) => {
      this.openExpandedPanelDrawer(event.payload.item);
    });

    return () => {
      expandPanelSub.unsubscribe();
    };
  }

  // see SceneProfilesExplorer
  getVariablesAndGridControls() {
    return {
      variables: [],
      gridControls: [
        sceneGraph.findByKeyAndType(this, 'quick-filter', SceneQuickFilter),
        sceneGraph.findByKeyAndType(this, 'layout-switcher', SceneLayoutSwitcher),
        sceneGraph.findByKeyAndType(this, 'no-data-switcher', SceneNoDataSwitcher),
      ],
    };
  }

  openExpandedPanelDrawer(item: GridItemData) {
    this.state.drawer.open({
      title: item.label,
      body:
        item.panelType === PanelType.BARGAUGE
          ? new SceneLabelValuesBarGauge({
              item,
              headerActions: () => [
                new SelectAction({ EventClass: EventViewServiceLabels, item }),
                new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
              ],
            })
          : new SceneLabelValuesTimeseries({
              displayAllValues: true,
              item,
              headerActions: () => [
                new SelectAction({ EventClass: EventViewServiceLabels, item }),
                new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
              ],
            }),
    });
  }

  static Component({ model }: SceneComponentProps<SceneExploreFavorites>) {
    const { body, drawer } = model.useState();

    return (
      <>
        <body.Component model={body} />
        <drawer.Component model={drawer} />
      </>
    );
  }
}
