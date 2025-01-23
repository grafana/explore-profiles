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
  }: {
    item?: GridItemData;
    headerActions: SceneMainServiceTimeseriesState['headerActions'];
  }) {
    super({
      headerActions,
      body: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this, item));
  }

  onActivate(item?: GridItemData) {
    this.setState({ body: this.buildTimeseries(item) });

    const groupByVariable = sceneGraph.findByKeyAndType(this, 'groupBy', GroupByVariable);

    const groupBySub = groupByVariable.subscribeToState((newState, prevState) => {
      if (newState.loading || !newState.options.length) {
        return;
      }

      if (prevState.loading) {
        this.onGroupByChanged(groupByVariable);
        return;
      }

      if (newState.value !== prevState.value) {
        this.onGroupByChanged(groupByVariable);
      }
    });

    const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);

    const profileMetricSub = profileMetricVariable.subscribeToState((newState, prevState) => {
      if (newState.value !== prevState.value) {
        this.onProfileMetricIdChanged();
      }
    });

    return () => {
      profileMetricSub.unsubscribe();
      groupBySub.unsubscribe();
    };
  }

  buildTimeseries(item?: GridItemData) {
    const { headerActions } = this.state;

    return new SceneLabelValuesTimeseries({
      item: {
        value: '',
        queryRunnerParams: {},
        label: this.buildTitle(),
        panelType: PanelType.TIMESERIES,
        ...item,
        index: 0,
      },
      data: !item
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
