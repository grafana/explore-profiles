import {
  MultiValueVariableState,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  SceneVariableState,
  VariableDependencyConfig,
  VizPanelState,
} from '@grafana/scenes';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { getSceneVariableValue } from '../helpers/getSceneVariableValue';
import { getProfileMetricLabel } from '../infrastructure/series/helpers/getProfileMetricLabel';
import { PanelType } from './SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { GridItemData } from './SceneByVariableRepeaterGrid/types/GridItemData';
import { SceneLabelValuesTimeseries } from './SceneLabelValuesTimeseries/SceneLabelValuesTimeseries';

interface SceneMainServiceTimeseriesState extends SceneObjectState {
  item?: GridItemData;
  headerActions: (item: GridItemData) => VizPanelState['headerActions'];
  body?: SceneLabelValuesTimeseries;
}

export class SceneMainServiceTimeseries extends SceneObjectBase<SceneMainServiceTimeseriesState> {
  static MIN_HEIGHT = 240;

  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetricId', 'groupBy'],
    onReferencedVariableValueChanged: (variable) => {
      if (variable.state.name === 'profileMetricId') {
        this.onProfileMetricChanged();
        return;
      }

      if (variable.state.name === 'groupBy') {
        this.onGroupByValueChanged(variable.state);
      }
    },
  });

  constructor({
    item,
    headerActions,
  }: {
    item: SceneMainServiceTimeseriesState['item'];
    headerActions: SceneMainServiceTimeseriesState['headerActions'];
  }) {
    super({
      item,
      headerActions,
      body: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const { headerActions } = this.state;

    this.setState({
      body: new SceneLabelValuesTimeseries({
        item: {
          index: 0,
          value: '',
          queryRunnerParams: {}, // the missing values will be interpolated
          label: this.buildTitle(),
          panelType: PanelType.TIMESERIES,
        },
        headerActions,
      }),
    });
  }

  buildTitle() {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const { description } = getProfileMetric(profileMetricId as ProfileMetricId);
    return description || getProfileMetricLabel(profileMetricId);
  }

  onProfileMetricChanged() {
    this.resetTimeseries();
  }

  onGroupByValueChanged(groupByVariableState: SceneVariableState) {
    const { value, options: rawOptions } = groupByVariableState as MultiValueVariableState;

    if (value === 'all') {
      this.resetTimeseries();
      return;
    }

    const options = rawOptions.filter((o) => o.value !== 'all').map((o) => JSON.parse(o.value as string));
    const index = options
      // See LabelsDataSource.ts
      .findIndex((o) => o.value === value);
    const startColorIndex = index > -1 ? index : 0;

    const groupBy = {
      label: value as string,
      values: options.find((o) => o.value === value)?.groupBy.values.map((v: any) => v.value) || [],
    };

    (this.state.body as SceneLabelValuesTimeseries).updateItem({
      index: startColorIndex,
      label: `${this.buildTitle()}, grouped by ${value}`,
      queryRunnerParams: { groupBy },
    });
  }

  resetTimeseries() {
    (this.state.body as SceneLabelValuesTimeseries).updateItem({
      index: 0,
      label: this.buildTitle(),
      queryRunnerParams: { groupBy: undefined },
    });
  }

  static Component({ model }: SceneComponentProps<SceneMainServiceTimeseries>) {
    const { body } = model.useState();

    return body && <body.Component model={body} />;
  }
}
