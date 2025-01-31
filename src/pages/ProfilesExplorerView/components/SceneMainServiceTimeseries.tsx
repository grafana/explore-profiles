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

import { FiltersVariable } from '../domain/variables/FiltersVariable/FiltersVariable';
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
    if (item) {
      this.initVariables(item);
    }

    this.setState({ body: this.buildTimeseries(item, supportGroupBy) });

    this.initSubscribers(item, supportGroupBy);
  }

  initVariables(item: GridItemData) {
    const { serviceName, profileMetricId, filters } = item.queryRunnerParams;

    if (serviceName) {
      const serviceNameVariable = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable);
      serviceNameVariable.changeValueTo(serviceName);
    }

    if (profileMetricId) {
      const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);
      profileMetricVariable.changeValueTo(profileMetricId);
    }

    if (filters) {
      const filtersVariable = sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable);
      filtersVariable.setState({ filters });
    }
  }

  buildTimeseries(item?: GridItemData, supportGroupBy?: boolean) {
    const { headerActions } = this.state;

    const timeseriesItem: GridItemData = {
      index: 0,
      value: '',
      queryRunnerParams: {}, // let interpolation happen
      label: this.buildTitle(),
      panelType: PanelType.TIMESERIES,
    };

    if (item && supportGroupBy) {
      timeseriesItem.queryRunnerParams.groupBy = item.queryRunnerParams.groupBy;
    }

    return new SceneLabelValuesTimeseries({
      item: timeseriesItem,
      headerActions,
      // we pass data to prevent rendering a timeseries without groupBy for a second then with groupBy
      data:
        !item && supportGroupBy
          ? new SceneDataTransformer({
              $data: new SceneQueryRunner({ datasource: PYROSCOPE_DATA_SOURCE, queries: [] }),
              transformations: [addRefId, addStats],
            })
          : undefined,
    });
  }

  initSubscribers(item?: GridItemData, supportGroupBy?: boolean) {
    const serviceNameVariable = sceneGraph.findByKeyAndType(this, 'serviceName', ServiceNameVariable);

    this._subs.add(
      serviceNameVariable.subscribeToState((newState, prevState) => {
        if (newState.value !== prevState.value) {
          this.resetTimeseries(true);
        }
      })
    );

    const profileMetricVariable = sceneGraph.findByKeyAndType(this, 'profileMetricId', ProfileMetricVariable);

    this._subs.add(
      profileMetricVariable.subscribeToState((newState, prevState) => {
        if (newState.value !== prevState.value) {
          this.resetTimeseries();
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

  resetTimeseries(resetFilters = false) {
    if (resetFilters) {
      sceneGraph.findByKeyAndType(this, 'filters', FiltersVariable).setState({ filters: [] });
    }

    (this.state.body as SceneLabelValuesTimeseries)?.updateItem({
      label: this.buildTitle(),
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
