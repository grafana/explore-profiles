import { css } from '@emotion/css';
import { FieldMatcherID, getValueFormat, GrafanaTheme2 } from '@grafana/data';
import {
  SceneComponentProps,
  SceneDataTransformer,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeRangeLike,
  SceneTimeRangeState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { InlineLabel, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { BASELINE_COLORS, COMPARISON_COLORS } from '../../../../../../pages/ComparisonView/ui/colors';
import { FiltersVariable } from '../../../../domain/variables/FiltersVariable/FiltersVariable';
import { getSceneVariableValue } from '../../../../helpers/getSceneVariableValue';
import { getSeriesStatsValue } from '../../../../infrastructure/helpers/getSeriesStatsValue';
import { getProfileMetricLabel } from '../../../../infrastructure/series/helpers/getProfileMetricLabel';
import { addRefId, addStats } from '../../../SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { CompareTarget } from '../../../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/types';
import { SceneLabelValuesTimeseries } from '../../../SceneLabelValuesTimeseries';
import {
  SceneTimeRangeWithAnnotations,
  TimeRangeWithAnnotationsMode,
} from './components/SceneTimeRangeWithAnnotations';
import {
  SwitchTimeRangeSelectionModeAction,
  TimerangeSelectionMode,
} from './domain/actions/SwitchTimeRangeSelectionModeAction';
import { EventSwitchTimerangeSelectionMode } from './domain/events/EventSwitchTimerangeSelectionMode';
import { buildCompareTimeSeriesQueryRunner } from './infrastructure/buildCompareTimeSeriesQueryRunner';

export interface SceneComparePanelState extends SceneObjectState {
  target: CompareTarget;
  title: string;
  filterKey: 'filtersBaseline' | 'filtersComparison';
  color: string;
  timePicker: SceneTimePicker;
  refreshPicker: SceneRefreshPicker;
  $timeRange: SceneTimeRange;
  timeseriesPanel?: SceneLabelValuesTimeseries;
}

export class SceneComparePanel extends SceneObjectBase<SceneComparePanelState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetricId'],
    onVariableUpdateCompleted: () => {
      this.state.timeseriesPanel?.updateTitle(this.buildTimeseriesTitle());
    },
  });

  constructor({
    target,
    initTimeRangeState,
  }: {
    target: SceneComparePanelState['target'];
    initTimeRangeState?: SceneTimeRangeState;
  }) {
    super({
      key: `${target}-panel`,
      target,
      title: target === CompareTarget.BASELINE ? 'Baseline' : 'Comparison',
      filterKey: target === CompareTarget.BASELINE ? 'filtersBaseline' : 'filtersComparison',
      color: target === CompareTarget.BASELINE ? BASELINE_COLORS.COLOR.toString() : COMPARISON_COLORS.COLOR.toString(),
      $timeRange: new SceneTimeRange({ key: `${target}-panel-timerange` }),
      timePicker: new SceneTimePicker({ isOnCanvas: true }),
      refreshPicker: new SceneRefreshPicker({ isOnCanvas: true }),
      timeseriesPanel: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this, initTimeRangeState));
  }

  onActivate(initTimeRangeState?: SceneTimeRangeState) {
    const { title, target, $timeRange } = this.state;

    if (initTimeRangeState) {
      $timeRange.setState(initTimeRangeState);
    }

    const timeseriesPanel = this.buildTimeSeriesPanel();

    timeseriesPanel.state.body.setState({
      $timeRange: new SceneTimeRangeWithAnnotations({
        key: `${target}-annotation-timerange`,
        mode: TimeRangeWithAnnotationsMode.ANNOTATIONS,
        annotationColor:
          target === CompareTarget.BASELINE ? BASELINE_COLORS.OVERLAY.toString() : COMPARISON_COLORS.OVERLAY.toString(),
        annotationTitle: `${title} time range`,
      }),
    });

    this.setState({ timeseriesPanel: timeseriesPanel });

    const eventSub = this.subscribeToEvents();

    return () => {
      eventSub.unsubscribe();
    };
  }

  protected getAncestorTimeRange(): SceneTimeRangeLike {
    if (!this.parent || !this.parent.parent) {
      throw new Error(typeof this + ' must be used within $timeRange scope');
    }

    return sceneGraph.getTimeRange(this.parent.parent);
  }

  subscribeToEvents() {
    return this.subscribeToEvent(EventSwitchTimerangeSelectionMode, (event) => {
      (this.state.timeseriesPanel?.state.body.state.$timeRange as SceneTimeRangeWithAnnotations).setState({
        mode:
          event.payload.mode === TimerangeSelectionMode.FLAMEGRAPH
            ? TimeRangeWithAnnotationsMode.ANNOTATIONS
            : TimeRangeWithAnnotationsMode.DEFAULT,
      });
    });
  }

  buildTimeSeriesPanel() {
    const { target, filterKey, title, color } = this.state;

    return new SceneLabelValuesTimeseries({
      item: {
        index: 0,
        value: target,
        label: this.buildTimeseriesTitle(),
        queryRunnerParams: {},
      },
      data: new SceneDataTransformer({
        $data: buildCompareTimeSeriesQueryRunner({ filterKey }),
        transformations: [addRefId, addStats],
      }),
      overrides: (series) =>
        series.map((s) => {
          const metricField = s.fields[1];
          const allValuesSum = getSeriesStatsValue(s, 'allValuesSum') || 0;
          const formattedValue = getValueFormat(metricField.config.unit)(allValuesSum);
          const displayName = `${title} total = ${formattedValue.text}${formattedValue.suffix}`;

          return {
            matcher: { id: FieldMatcherID.byFrameRefID, options: s.refId },
            properties: [
              {
                id: 'displayName',
                value: displayName,
              },
              {
                id: 'color',
                value: { mode: 'fixed', fixedColor: color },
              },
            ],
          };
        }),
      headerActions: () => [new SwitchTimeRangeSelectionModeAction()],
    });
  }

  buildTimeseriesTitle() {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const { description } = getProfileMetric(profileMetricId as ProfileMetricId);
    return description || getProfileMetricLabel(profileMetricId);
  }

  getDiffTimeRange() {
    return this.state.timeseriesPanel?.state.body.state.$timeRange as SceneTimeRangeWithAnnotations;
  }

  public static Component = ({ model }: SceneComponentProps<SceneComparePanel>) => {
    const styles = useStyles2(getStyles);
    const { title, timeseriesPanel: timeseries, timePicker, refreshPicker, filterKey } = model.useState();

    const filtersVariable = sceneGraph.findByKey(model, filterKey) as FiltersVariable;

    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h6>{title}</h6>

          <div className={styles.timePicker}>
            <timePicker.Component model={timePicker} />
            <refreshPicker.Component model={refreshPicker} />
          </div>
        </div>

        <div className={styles.filter}>
          <InlineLabel width="auto">{filtersVariable.state.label}</InlineLabel>
          <filtersVariable.Component model={filtersVariable} />
        </div>

        <div className={styles.timeseries}>{timeseries && <timeseries.Component model={timeseries} />}</div>
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  panel: css`
    background-color: ${theme.colors.background.primary};
    padding: ${theme.spacing(1)} ${theme.spacing(1)} 0 ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.weak};
    border-radius: 2px;
  `,
  panelHeader: css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: ${theme.spacing(2)};

    & > h6 {
      margin-top: -2px;
    }
  `,
  timePicker: css`
    display: flex;
    justify-content: flex-end;
    gap: ${theme.spacing(1)};
  `,
  filter: css`
    display: flex;
    margin-bottom: ${theme.spacing(3)};
  `,
  timeseries: css`
    height: 200px;

    & [data-viz-panel-key] > div {
      border: 0 none;
    }
  `,
});
