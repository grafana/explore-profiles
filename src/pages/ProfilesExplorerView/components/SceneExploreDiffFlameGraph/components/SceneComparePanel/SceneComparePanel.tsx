import { css } from '@emotion/css';
import { dateTimeFormat, FieldMatcherID, getValueFormat, GrafanaTheme2, systemDateFormats } from '@grafana/data';
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
  VariableDependencyConfig,
} from '@grafana/scenes';
import { InlineLabel, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { omit } from 'lodash';
import React from 'react';

import { BASELINE_COLORS, COMPARISON_COLORS } from '../../../../../ComparisonView/ui/colors';
import { getDefaultTimeRange } from '../../../../domain/getDefaultTimeRange';
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
import { RangeAnnotation } from './domain/RangeAnnotation';
import { buildCompareTimeSeriesQueryRunner } from './infrastructure/buildCompareTimeSeriesQueryRunner';

export interface SceneComparePanelState extends SceneObjectState {
  target: CompareTarget;
  filterKey: 'filtersBaseline' | 'filtersComparison';
  title: string;
  color: string;
  timePicker: SceneTimePicker;
  refreshPicker: SceneRefreshPicker;
  $timeRange: SceneTimeRange;
  timeseriesPanel: SceneLabelValuesTimeseries;
}

export class SceneComparePanel extends SceneObjectBase<SceneComparePanelState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetricId'],
    onReferencedVariableValueChanged: () => {
      this.state.timeseriesPanel.updateTitle(this.buildTimeseriesTitle());
    },
  });

  constructor({
    target,
    useAncestorTimeRange,
  }: {
    target: SceneComparePanelState['target'];
    useAncestorTimeRange: boolean;
  }) {
    const filterKey = target === CompareTarget.BASELINE ? 'filtersBaseline' : 'filtersComparison';
    const title = target === CompareTarget.BASELINE ? 'Baseline' : 'Comparison';
    const color =
      target === CompareTarget.BASELINE ? BASELINE_COLORS.COLOR.toString() : COMPARISON_COLORS.COLOR.toString();

    super({
      key: `${target}-panel`,
      target,
      filterKey,
      title,
      color,
      $timeRange: new SceneTimeRange({ key: `${target}-panel-timerange`, ...getDefaultTimeRange() }),
      timePicker: new SceneTimePicker({ isOnCanvas: true }),
      refreshPicker: new SceneRefreshPicker({ isOnCanvas: true }),
      timeseriesPanel: SceneComparePanel.buildTimeSeriesPanel({ target, filterKey, title, color }),
    });

    this.addActivationHandler(this.onActivate.bind(this, useAncestorTimeRange));
  }

  onActivate(useAncestorTimeRange: boolean) {
    const { $timeRange, timeseriesPanel } = this.state;

    if (useAncestorTimeRange) {
      $timeRange.setState(omit(this.getAncestorTimeRange().state, 'key'));
    }

    timeseriesPanel.updateTitle(this.buildTimeseriesTitle());

    const eventSub = this.subscribeToEvents();

    return () => {
      eventSub.unsubscribe();
    };
  }

  static buildTimeSeriesPanel({ target, filterKey, title, color }: any) {
    const timeseriesPanel = new SceneLabelValuesTimeseries({
      item: {
        index: 0,
        value: target,
        label: '',
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
          const total = `${formattedValue.text}${formattedValue.suffix}`;
          const [diffFrom, diffTo, timeZone] = SceneComparePanel.getFlameGraphRange(timeseriesPanel);

          const displayName =
            diffFrom && diffTo
              ? `${title} total = ${total} / Flame graph range = ${dateTimeFormat(diffFrom, {
                  format: systemDateFormats.fullDate,
                  timeZone,
                })} → ${dateTimeFormat(diffTo, {
                  format: systemDateFormats.fullDate,
                  timeZone,
                })}`
              : `${title} total = ${total}`;

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

    timeseriesPanel.state.body.setState({
      $timeRange: new SceneTimeRangeWithAnnotations({
        key: `${target}-annotation-timerange`,
        mode: TimeRangeWithAnnotationsMode.ANNOTATIONS,
        annotationColor:
          target === CompareTarget.BASELINE ? BASELINE_COLORS.OVERLAY.toString() : COMPARISON_COLORS.OVERLAY.toString(),
        annotationTitle: `${title} flame graph range`,
      }),
    });

    return timeseriesPanel;
  }

  static getFlameGraphRange(
    timeseriesPanel: SceneLabelValuesTimeseries
  ): [number | undefined, number | undefined, string | undefined] {
    let diffFrom: number | undefined;
    let diffTo: number | undefined;

    const annotation = timeseriesPanel.state.body.state.$data?.state.data?.annotations?.[0] as RangeAnnotation;

    annotation?.fields.some(({ name, values }) => {
      diffFrom ||= name === 'time' ? values[0] : undefined;
      diffTo ||= name === 'timeEnd' ? values[0] : undefined;
      return diffFrom && diffTo;
    });

    return [diffFrom, diffTo, timeseriesPanel.state.$timeRange?.state.timeZone];
  }

  protected getAncestorTimeRange(): SceneTimeRangeLike {
    if (!this.parent || !this.parent.parent) {
      throw new Error(typeof this + ' must be used within $timeRange scope');
    }

    return sceneGraph.getTimeRange(this.parent.parent);
  }

  subscribeToEvents() {
    return this.subscribeToEvent(EventSwitchTimerangeSelectionMode, (event) => {
      // this triggers a timeseries request to the API
      // TODO: caching?
      (this.state.timeseriesPanel.state.body.state.$timeRange as SceneTimeRangeWithAnnotations).setState({
        mode:
          event.payload.mode === TimerangeSelectionMode.FLAMEGRAPH
            ? TimeRangeWithAnnotationsMode.ANNOTATIONS
            : TimeRangeWithAnnotationsMode.DEFAULT,
      });
    });
  }

  buildTimeseriesTitle() {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const { description } = getProfileMetric(profileMetricId as ProfileMetricId);
    return description || getProfileMetricLabel(profileMetricId);
  }

  useDiffTimeRange() {
    return (this.state.timeseriesPanel.state.body.state.$timeRange as SceneTimeRangeWithAnnotations).useState();
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
      height: 32px;
      line-height: 32px;
      margin: 0 ${theme.spacing(1)} 0 0;
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

    & [data-viz-panel-key] > * {
      border: 0 none;
    }
  `,
});
