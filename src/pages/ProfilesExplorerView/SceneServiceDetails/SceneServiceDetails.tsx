import { DashboardCursorSync } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  sceneGraph,
  SceneObjectBase,
  SceneQueryRunner,
  VariableDependencyConfig,
  VizPanel,
} from '@grafana/scenes';
import React from 'react';

import { FavAction } from '../actions/FavAction';
import { SceneTabs } from '../components/SceneTabs';
import { buildTimeSeriesGroupByQueryRunner } from '../data/buildTimeSeriesGroupByQueryRunner';
import { buildTimeSeriesQueryRunner } from '../data/buildTimeSeriesQueryRunner';
import { ProfileMetricsDataSource } from '../data/ProfileMetricsDataSource';
import { EventSelectLabel } from '../events/EventSelectLabel';
import { getColorByIndex } from '../helpers/getColorByIndex';
import { GridItemData } from '../types/GridItemData';
import { SceneExploreLabels } from './SceneExploreLabels';
import { SceneFlameGraph } from './SceneFlameGraph';

interface SceneServiceDetailsState extends EmbeddedSceneState {
  gridItemData?: GridItemData;
}

const MIN_HEIGHT_TIMESERIES = 200;

export class SceneServiceDetails extends SceneObjectBase<SceneServiceDetailsState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      const timeSeriesPanel = ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).state
        .body as VizPanel;

      timeSeriesPanel?.setState({ title: this.buildtimeSeriesPanelTitle() });
    },
  });

  constructor({ gridItemData }: { gridItemData?: GridItemData }) {
    super({
      key: 'service-details',
      gridItemData,
      body: new SceneFlexLayout({
        direction: 'column',
        $behaviors: [
          new behaviors.CursorSync({
            key: 'metricCrosshairSync',
            sync: DashboardCursorSync.Crosshair,
          }),
        ],
        children: [
          new SceneFlexItem({
            minHeight: MIN_HEIGHT_TIMESERIES,
            body: undefined,
          }),
          new SceneFlexItem({
            body: new SceneTabs({
              activeTabId: 'explore-labels', // TODO: temp
              tabs: [
                {
                  id: 'flame-graph',
                  label: 'Flame graph',
                  content: new SceneFlameGraph({ gridItemData }),
                },
                {
                  id: 'explore-labels',
                  label: 'Explore labels',
                  content: new SceneExploreLabels({ gridItemData }),
                },
              ],
            }),
          }),
        ],
      }),
    });

    this.addActivationHandler(() => {
      this.buildTimeSeriesPanel(gridItemData);

      const selectLabelSub = this.subscribeToEvent(EventSelectLabel, (event) => {
        this.buildTimeSeriesPanel(event.payload.item);
      });

      return () => {
        selectLabelSub.unsubscribe();
      };
    });
  }

  async buildTimeSeriesPanel(gridItemData?: GridItemData) {
    const thisGridItemData = gridItemData || {
      index: 0,
      value: '',
      label: '',
      queryRunnerParams: {},
    };

    this.setState({ gridItemData: thisGridItemData });

    let data: SceneQueryRunner;

    if (thisGridItemData.queryRunnerParams.groupBy) {
      const timeRange = sceneGraph.getTimeRange(this).state.value;
      // TODO: handle error
      data = await buildTimeSeriesGroupByQueryRunner(thisGridItemData.queryRunnerParams, timeRange);
    } else {
      data = buildTimeSeriesQueryRunner(thisGridItemData.queryRunnerParams);
    }

    const timeSeriesPanel = PanelBuilders.timeseries()
      .setTitle(this.buildtimeSeriesPanelTitle())
      .setData(data)
      .setColor({ mode: 'fixed', fixedColor: getColorByIndex(thisGridItemData.index) })
      .setOverrides((overrides) => {
        if (data.state.queries.length > 1) {
          data.state.queries.forEach(({ refId, displayNameOverride }, j: number) => {
            // matches "refId" in src/pages/ProfilesExplorerView/data/buildTimeSeriesQueryRunner.ts
            overrides
              .matchFieldsByQuery(refId)
              .overrideColor({ mode: 'fixed', fixedColor: getColorByIndex(thisGridItemData.index + j) })
              .overrideDisplayName(displayNameOverride);
          });
        }
      })
      .setCustomFieldConfig('fillOpacity', 9)
      .setHeaderActions([new FavAction({ item: thisGridItemData })])
      .build();

    timeSeriesPanel.setState({ key: 'service-details-timeseries' });

    ((this.state.body as SceneFlexLayout).state.children[0] as SceneFlexItem).setState({
      body: timeSeriesPanel,
    });
  }

  buildtimeSeriesPanelTitle() {
    const serviceName = sceneGraph.lookupVariable('serviceName', this)?.getValue() as string;
    const profileMetricId = sceneGraph.lookupVariable('profileMetricId', this)?.getValue() as string;
    const itemLabel = this.state.gridItemData?.label;

    return itemLabel
      ? `${serviceName} · ${ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId)} · ${itemLabel}`
      : `${serviceName} · ${ProfileMetricsDataSource.getProfileMetricLabel(profileMetricId)}`;
  }

  static Component({ model }: SceneComponentProps<SceneServiceDetails>) {
    const { body } = model.useState();

    return <body.Component model={body} />;
  }
}
