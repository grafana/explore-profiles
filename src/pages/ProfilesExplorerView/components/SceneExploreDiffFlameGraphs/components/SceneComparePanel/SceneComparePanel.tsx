import { css } from '@emotion/css';
import { dateTime, FieldMatcherID, getValueFormat, GrafanaTheme2, PanelData, TimeRange } from '@grafana/data';
import {
  SceneComponentProps,
  SceneDataTransformer,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeRangeState,
  VariableDependencyConfig,
} from '@grafana/scenes';
import { InlineLabel, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { BASELINE_COLORS, COMPARISON_COLORS } from '../../../../../../pages/ComparisonView/ui/colors';
import { FiltersVariable } from '../../../..//domain/variables/FiltersVariable/FiltersVariable';
import { getSceneVariableValue } from '../../../../helpers/getSceneVariableValue';
import { getProfileMetricLabel } from '../../../../infrastructure/series/helpers/getProfileMetricLabel';
import { addRefId, addStats } from '../../../SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { getSeriesStatsValue } from '../../../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/getSeriesStatsValue';
import { CompareTarget } from '../../../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/types';
import { SceneLabelValuesTimeseries } from '../../../SceneLabelValuesTimeseries/SceneLabelValuesTimeseries';
import {
  SwitchTimeRangeSelectionModeAction,
  TimerangeSelectionMode,
} from './domain/actions/SwitchTimeRangeSelectionModeAction';
import { EventSwitchTimerangeSelectionMode } from './domain/events/EventSwitchTimerangeSelectionMode';
import { RangeAnnotation } from './domain/RangeAnnotation';
import { buildCompareTimeSeriesQueryRunner } from './infrastructure/buildCompareTimeSeriesQueryRunner';
import { SceneTimeRangeWithAnnotations } from './SceneTimeRangeWithAnnotations';

export interface SceneComparePanelState extends SceneObjectState {
  target: CompareTarget;
  title: string;
  filterKey: 'filtersBaseline' | 'filtersComparison';
  color: string;
  annotationColor: string;
  timePicker: SceneTimePicker;
  refreshPicker: SceneRefreshPicker;
  timeseries?: SceneLabelValuesTimeseries;
  $timeRange: SceneTimeRange;
}

const getDefaultTimeRange = (): SceneTimeRangeState => {
  const now = dateTime();

  return {
    from: 'now-5m',
    to: 'now',
    value: {
      from: dateTime(now).subtract(5, 'minutes'),
      to: now,
      raw: { from: 'now-5m', to: 'now' },
    },
  };
};

export class SceneComparePanel extends SceneObjectBase<SceneComparePanelState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetricId'],
    onVariableUpdateCompleted: () => {
      this.state.timeseries?.updateTitle(this.buildTimeseriesTitle());
    },
  });

  constructor({ target }: { target: SceneComparePanelState['target'] }) {
    super({
      key: `diff-panel-${target}`,
      target,
      title: target === CompareTarget.BASELINE ? 'Baseline' : 'Comparison',
      filterKey: target === CompareTarget.BASELINE ? 'filtersBaseline' : 'filtersComparison',
      color: target === CompareTarget.BASELINE ? BASELINE_COLORS.COLOR.toString() : COMPARISON_COLORS.COLOR.toString(),
      annotationColor:
        target === CompareTarget.BASELINE ? BASELINE_COLORS.OVERLAY.toString() : COMPARISON_COLORS.OVERLAY.toString(),
      $timeRange: new SceneTimeRange(getDefaultTimeRange()),
      timePicker: new SceneTimePicker({ isOnCanvas: true }),
      refreshPicker: new SceneRefreshPicker({ isOnCanvas: true }),
      timeseries: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const { title, annotationColor } = this.state;

    this.subscribeToEvent(EventSwitchTimerangeSelectionMode, (event) => {
      this.switchSelectionMode(event.payload);
    });

    const timeseries = this.buildTimeSeries();

    function updateAnnotation(timeRange: TimeRange, data?: PanelData) {
      if (!data) {
        return;
      }

      const annotation = new RangeAnnotation();

      annotation.addRange({
        text: `${title} time range`,
        color: annotationColor,
        time: timeRange.from.unix() * 1000,
        timeEnd: timeRange.to.unix() * 1000,
      });

      $data?.setState({
        data: {
          ...data,
          annotations: [annotation],
        },
      });
    }

    timeseries.setState({
      $timeRange: new SceneTimeRangeWithAnnotations({
        onTimeRangeChange(timeRange) {
          updateAnnotation(timeRange, timeseries.state.body.state.$data?.state.data);
        },
      }),
    });

    this.setState({ timeseries });

    const { $data } = timeseries.state.body.state;

    $data?.subscribeToState((newState, prevState) => {
      if (!newState.data) {
        return;
      }

      if (!newState.data?.annotations?.length && !prevState.data?.annotations?.length) {
        // updateAnnotation(this.state.$timeRange.state.value, newState.data);
        return;
      }

      if (!newState.data?.annotations?.length && prevState.data?.annotations?.length) {
        newState.data.annotations = prevState.data.annotations;
      }
    });
  }

  buildTimeSeries() {
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

  switchSelectionMode({ mode }: { mode: TimerangeSelectionMode }) {
    console.log('*** switchSelectionMode', mode);
  }

  public static Component = ({ model }: SceneComponentProps<SceneComparePanel>) => {
    const styles = useStyles2(getStyles);
    const { title, timeseries, timePicker, refreshPicker, filterKey } = model.useState();

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
