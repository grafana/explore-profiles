import { EmbeddedSceneState, SceneComponentProps, SceneObjectBase, SceneVariableSet } from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { SceneAllLabelValuesTable } from '../../components/SceneAllLabelValuesTable';
import { SceneAllLabelValuesTimeseries } from '../../components/SceneAllLabelValuesTimeseries';
import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/GridItemData';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { SceneDrawer } from '../../components/SceneDrawer';
import { EventExpandPanel } from '../../events/EventExpandPanel';
import { EventViewLabelValuesDistribution } from '../../events/EventViewLabelValuesDistribution';
import { EventViewServiceFlameGraph } from '../../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../events/EventViewServiceLabels';
import { FavoriteVariable } from '../../variables/FavoriteVariable';

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
        headerActions: (item) => {
          const actions: Array<SelectAction | FavAction> = [
            new SelectAction({ EventClass: EventViewServiceLabels, item, skipVariablesInterpolation: true }),
            new SelectAction({ EventClass: EventViewServiceFlameGraph, item, skipVariablesInterpolation: true }),
          ];

          if (item.queryRunnerParams.groupBy) {
            actions.push(
              new SelectAction({
                EventClass: EventViewLabelValuesDistribution,
                item,
                tooltip: 'View the distribution of all the values',
                skipVariablesInterpolation: true,
              }),
              new SelectAction({
                EventClass: EventExpandPanel,
                item,
                tooltip: 'Expand this panel to view all the timeseries',
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
    const labelValuesDistSub = this.subscribeToEvent(EventViewLabelValuesDistribution, async (event) => {
      this.openLabelValuesDistributionDrawer(event.payload.item);
    });

    const expandPanelSub = this.subscribeToEvent(EventExpandPanel, async (event) => {
      this.openExpandedPanelDrawer(event.payload.item);
    });

    return () => {
      expandPanelSub.unsubscribe();
      labelValuesDistSub.unsubscribe();
    };
  }

  openLabelValuesDistributionDrawer(item: GridItemData) {
    this.state.drawer.open({
      title: item.label,
      body: new SceneAllLabelValuesTable({
        item,
        headerActions: () => [
          new SelectAction({ EventClass: EventViewServiceLabels, item }),
          new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
          new SelectAction({ EventClass: EventExpandPanel, item }),
        ],
      }),
    });
  }

  openExpandedPanelDrawer(item: GridItemData) {
    this.state.drawer.open({
      title: item.label,
      body: new SceneAllLabelValuesTimeseries({
        item,
        headerActions: () => [
          new SelectAction({ EventClass: EventViewServiceLabels, item }),
          new SelectAction({ EventClass: EventViewServiceFlameGraph, item }),
          new SelectAction({ EventClass: EventViewLabelValuesDistribution, item }),
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
