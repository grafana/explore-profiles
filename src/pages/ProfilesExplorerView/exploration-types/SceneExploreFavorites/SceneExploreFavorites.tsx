import { LoadingState } from '@grafana/data';
import {
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneCSSGridItem,
  SceneDataTransformer,
  SceneObjectBase,
  SceneVariableSet,
  VizPanel,
} from '@grafana/scenes';
import { TableCellDisplayMode } from '@grafana/ui';
import { merge } from 'lodash';
import React from 'react';

import { FavAction } from '../../actions/FavAction';
import { SelectAction } from '../../actions/SelectAction';
import { GridItemData } from '../../components/SceneByVariableRepeaterGrid/GridItemData';
import { SceneByVariableRepeaterGrid } from '../../components/SceneByVariableRepeaterGrid/SceneByVariableRepeaterGrid';
import { SceneDrawer } from '../../components/SceneDrawer';
import { getProfileMetricUnit } from '../../data/series/helpers/getProfileMetricUnit';
import { buildTimeSeriesQueryRunner } from '../../data/timeseries/buildTimeSeriesQueryRunner';
import { EventExpandPanel } from '../../events/EventExpandPanel';
import { EventViewLabelValuesDistribution } from '../../events/EventViewLabelValuesDistribution';
import { EventViewServiceFlameGraph } from '../../events/EventViewServiceFlameGraph';
import { EventViewServiceLabels } from '../../events/EventViewServiceLabels';
import { findSceneObjectByKey } from '../../helpers/findSceneObjectByKey';
import { getColorByIndex } from '../../helpers/getColorByIndex';
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
    const { queryRunnerParams } = item;
    const { label } = queryRunnerParams.groupBy!;

    const transformedData = new SceneDataTransformer({
      $data: buildTimeSeriesQueryRunner(queryRunnerParams, true),
      transformations: [
        {
          id: 'reduce',
          options: {
            labelsToFields: true,
            reducers: ['mean', 'stdDev', 'sum'],
          },
        },
        {
          id: 'filterFieldsByName',
          options: {
            byVariable: false,
            include: {
              names: [label, 'Mean', 'StdDev', 'Total'],
            },
          },
        },
      ],
    });

    const timeSeriesPanel = (
      findSceneObjectByKey(this, SceneByVariableRepeaterGrid.buildGridItemKey(item)) as SceneCSSGridItem
    ).state.body as VizPanel;

    const headerActions = (timeSeriesPanel.state.headerActions as SelectAction[])
      .filter((action) => action.state.EventClass !== EventViewLabelValuesDistribution)
      .map((action) => action.clone());

    const tablePanel = PanelBuilders.table()
      .setData(transformedData)
      .setDisplayMode('transparent')
      .setCustomFieldConfig('filterable', true)
      .setCustomFieldConfig('cellOptions', { type: TableCellDisplayMode.ColorText })
      .setColor({ mode: 'fixed', fixedColor: '#CCCCDC' })
      .setUnit(getProfileMetricUnit(queryRunnerParams.profileMetricId!))
      .setOverrides((overrides) => {
        overrides.matchFieldsWithName(queryRunnerParams.groupBy!.label).overrideUnit('string');
      })
      .setHeaderActions(headerActions)
      .setOption('sortBy', [{ displayName: 'Total', desc: true }])
      .build();

    transformedData.subscribeToState((newState) => {
      if (newState.data?.state !== LoadingState.Done) {
        return;
      }

      const { fields } = newState.data.series[0];

      const newFieldConfig = merge({}, tablePanel.state.fieldConfig, {
        defaults: {
          mappings: [
            {
              type: 'value',
              options: fields[0].values.reduce((acc, value, j) => {
                acc[value] = {
                  text: value,
                  color: getColorByIndex(j),
                  index: j,
                };
                return acc;
              }, {}),
            },
          ],
        },
      });

      tablePanel.setState({ fieldConfig: newFieldConfig });
    });

    this.state.drawer.open({
      title: item.label,
      body: tablePanel,
    });
  }

  openExpandedPanelDrawer(item: GridItemData) {
    const timeSeriesPanel = (
      findSceneObjectByKey(this, SceneByVariableRepeaterGrid.buildGridItemKey(item)) as SceneCSSGridItem
    ).state.body!.clone() as VizPanel;

    const { label, queryRunnerParams } = item;

    timeSeriesPanel.setState({
      title: '',
      description: '',
      $data: buildTimeSeriesQueryRunner(queryRunnerParams),
      headerActions: (timeSeriesPanel.state.headerActions as SelectAction[]).filter(
        (action) => action.state.EventClass !== EventExpandPanel
      ),
      fieldConfig: {
        defaults: {
          custom: {
            fillOpacity: 0,
          },
        },
        overrides: [],
      },
    });

    this.state.drawer.open({
      title: label,
      body: timeSeriesPanel,
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
