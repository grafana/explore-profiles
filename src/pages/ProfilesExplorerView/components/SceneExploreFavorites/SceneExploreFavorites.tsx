import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase, SceneVariableSet } from '@grafana/scenes';
import React from 'react';

import { PanelType } from '../../components/SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneDrawer } from '../../components/SceneDrawer';
import { SceneLabelValuesBarGauge } from '../../components/SceneLabelValuesBarGauge';
import { SceneLabelValuesTimeseries } from '../../components/SceneLabelValuesTimeseries';
import { FavAction } from '../../domain/actions/FavAction';
import { SelectAction } from '../../domain/actions/SelectAction';
import { EventExpandPanel } from '../../domain/events/EventExpandPanel';
import { EventViewServiceFlameGraph } from '../../domain/events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../domain/events/EventViewServiceLabels';
import { FavoriteVariable } from '../../domain/variables/FavoriteVariable';

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
        dependentVariableNames: [],
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
    const expandPanelSub = this.subscribeToEvent(EventExpandPanel, async (event) => {
      this.openExpandedPanelDrawer(event.payload.item);
    });

    return () => {
      expandPanelSub.unsubscribe();
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
