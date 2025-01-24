import {
  SceneComponentProps,
  SceneDataTransformer,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
  VizPanelState,
} from '@grafana/scenes';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { GroupByVariable } from '../domain/variables/GroupByVariable/GroupByVariable';
import { ProfileMetricVariable } from '../domain/variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../domain/variables/ServiceNameVariable/ServiceNameVariable';
import { getSceneVariableValue } from '../helpers/getSceneVariableValue';
import { PYROSCOPE_DATA_SOURCE } from '../infrastructure/pyroscope-data-sources';
import { getProfileMetricLabel } from '../infrastructure/series/helpers/getProfileMetricLabel';
import { PanelType } from './SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { addRefId, addStats } from './SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { GridItemData } from './SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneLabelValuesTimeseries } from './SceneLabelValuesTimeseries/SceneLabelValuesTimeseries';

interface SceneMainServiceTimeseriesState extends SceneObjectState {
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  body?: SceneLabelValuesTimeseries;
}

export class SceneMainServiceTimeseries extends SceneObjectBase<SceneMainServiceTimeseriesState> {
  static MIN_HEIGHT = 240;

  constructor({
    item,
    headerActions,
    supportGroupBy,
  }: {
    item?: GridItemData;
    headerActions: SceneMainServiceTimeseriesState['headerActions'];
    supportGroupBy?: boolean;
  }) {
    super({
      headerActions,
      body: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this, item, supportGroupBy));
  }

  onActivate(item?: GridItemData, supportGroupBy?: boolean) {
    this.setState({
      body: this.buildTimeseries(item, supportGroupBy),
    });

    const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);

    this._subs.add(
      profileMetricVariable.subscribeToState((newState, prevState) => {
        if (newState.value !== prevState.value) {
          this.onProfileMetricIdChanged();
        }
      })
    );

    if (supportGroupBy) {
      this.subscribeToGroupByStateChanges(item);
    }
  }

  subscribeToGroupByStateChanges(item?: GridItemData) {
    const groupByVariable = sceneGraph.findByKeyAndType(this, 'groupBy', GroupByVariable);

    this._subs.add(
      groupByVariable.subscribeToState((newState, prevState) => {
        if (newState.loading || !newState.options.length) {
          return;
        }

        // First load:
        // here we check for the item to prevent two queries to occur when coming from (e.g) favorites and
        // selecting an item with a different profile metric than the current ProfileMetricVariable value
        if (!item && prevState.loading) {
          this.onGroupByChanged(groupByVariable);
          return;
        }

        if (newState.value !== prevState.value) {
          this.onGroupByChanged(groupByVariable);
        }
      })
    );
  }

  buildTimeseries(item?: GridItemData, supportGroupBy?: boolean) {
    const { headerActions } = this.state;

    const timeseriesItem = {
      index: 0,
      value: '',
      queryRunnerParams: {},
      label: this.buildTitle(),
      panelType: PanelType.TIMESERIES,
      ...item,
    };

    if (!supportGroupBy) {
      delete timeseriesItem.queryRunnerParams.groupBy;
    }

    if (!timeseriesItem.queryRunnerParams.groupBy) {
      timeseriesItem.index = 0;
    }

    return new SceneLabelValuesTimeseries({
      item: timeseriesItem,
      data:
        !item && supportGroupBy
          ? new SceneDataTransformer({
              $data: new SceneQueryRunner({ datasource: PYROSCOPE_DATA_SOURCE, queries: [] }),
              transformations: [addRefId, addStats],
            })
          : undefined,
      headerActions,
    });
  }

  onGroupByChanged(groupByVariable: GroupByVariable) {
    if (!groupByVariable.state.value || groupByVariable.state.value === 'all') {
      this.resetTimeseries();
      return;
    }

    const { index, value, groupBy } = groupByVariable.findCurrentOption();

    (this.state.body as SceneLabelValuesTimeseries)?.updateItem({
      index,
      label: `${this.buildTitle()}, grouped by ${value}`,
      queryRunnerParams: { groupBy },
    });
  }

  onProfileMetricIdChanged() {
    this.resetTimeseries();
  }

  resetTimeseries() {
    const { value: serviceName } = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable).state;
    const { value: profileMetricId } = sceneGraph.findByKeyAndType(
      this,
      'profileMetricId',
      ProfileMetricVariable
    ).state;

    (this.state.body as SceneLabelValuesTimeseries)?.updateItem({
      index: 0,
      label: this.buildTitle(),
      queryRunnerParams: {
        serviceName: serviceName as string,
        profileMetricId: profileMetricId as string,
        groupBy: undefined,
      },
    });
  }

  buildTitle() {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const { description } = getProfileMetric(profileMetricId as ProfileMetricId);
    return description || getProfileMetricLabel(profileMetricId);
  }

  static Component({ model }: SceneComponentProps<SceneMainServiceTimeseries>) {
    const { body } = model.useState();

    return body && <body.Component model={body} />;
  }
}
