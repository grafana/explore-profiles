import { css, cx } from '@emotion/css';
import {
  dateTime,
  dateTimeFormat,
  FieldMatcherID,
  getValueFormat,
  GrafanaTheme2,
  systemDateFormats,
} from '@grafana/data';
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
import { IconButton, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { omit } from 'lodash';
import React from 'react';

import { buildTimeRange } from '../../../../domain/buildTimeRange';
import { FiltersVariable } from '../../../../domain/variables/FiltersVariable/FiltersVariable';
import { getSceneVariableValue } from '../../../../helpers/getSceneVariableValue';
import { getSeriesStatsValue } from '../../../../infrastructure/helpers/getSeriesStatsValue';
import { getProfileMetricLabel } from '../../../../infrastructure/series/helpers/getProfileMetricLabel';
import { PanelType } from '../../../SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { addRefId, addStats } from '../../../SceneByVariableRepeaterGrid/infrastructure/data-transformations';
import { SceneLabelValuesTimeseries } from '../../../SceneLabelValuesTimeseries';
import { CompareTarget } from '../../domain/types';
import { Preset } from '../ScenePresetsPicker/ScenePresetsPicker';
import {
  SceneTimeRangeWithAnnotations,
  TimeRangeWithAnnotationsMode,
} from './components/SceneTimeRangeWithAnnotations';
import {
  SwitchTimeRangeSelectionModeAction,
  TimerangeSelectionMode,
} from './domain/actions/SwitchTimeRangeSelectionModeAction';
import { EventEnableSyncTimeRanges } from './domain/events/EventEnableSyncTimeRanges';
import { EventSwitchTimerangeSelectionMode } from './domain/events/EventSwitchTimerangeSelectionMode';
import { EventSyncTimeRanges } from './domain/events/EventSyncTimeRanges';
import { RangeAnnotation } from './domain/RangeAnnotation';
import { buildCompareTimeSeriesQueryRunner } from './infrastructure/buildCompareTimeSeriesQueryRunner';
import { BASELINE_COLORS, COMPARISON_COLORS } from './ui/colors';

const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;

interface SceneComparePanelState extends SceneObjectState {
  target: CompareTarget;
  filterKey: 'filtersBaseline' | 'filtersComparison';
  title: string;
  color: string;
  timePicker: SceneTimePicker;
  refreshPicker: SceneRefreshPicker;
  $timeRange: SceneTimeRange;
  timeseriesPanel: SceneLabelValuesTimeseries;
  timeRangeSyncEnabled: boolean;
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
      $timeRange: new SceneTimeRange({ key: `${target}-panel-timerange`, ...buildTimeRange('now-1h', 'now') }),
      timePicker: new SceneTimePicker({ isOnCanvas: true }),
      refreshPicker: new SceneRefreshPicker({ isOnCanvas: true }),
      timeseriesPanel: SceneComparePanel.buildTimeSeriesPanel({ target, filterKey, title, color }),
      timeRangeSyncEnabled: false,
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
        panelType: PanelType.TIMESERIES,
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
          const [diffFrom, diffTo, timeZone] = SceneComparePanel.getDiffRange(timeseriesPanel);

          const displayName =
            diffFrom && diffTo
              ? `Total = ${total} / Flame graph range = ${dateTimeFormat(diffFrom, {
                  format: systemDateFormats.fullDate,
                  timeZone,
                })} → ${dateTimeFormat(diffTo, {
                  format: systemDateFormats.fullDate,
                  timeZone,
                })}`
              : `Total = ${total}`;

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

  static getDiffRange(
    timeseriesPanel: SceneLabelValuesTimeseries
  ): [number | undefined, number | undefined, string | undefined] {
    let diffFrom: number | undefined;
    let diffTo: number | undefined;

    const annotation = timeseriesPanel.state.body.state.$data?.state.data?.annotations?.[0] as RangeAnnotation;

    annotation?.fields.some(({ name, values }) => {
      diffFrom = name === 'time' ? values[0] : diffFrom;
      diffTo = name === 'timeEnd' ? values[0] : diffTo;
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
    const { target, timeseriesPanel, $timeRange } = this.state;

    const $annotationTimeRange = timeseriesPanel.state.body.state.$timeRange as SceneTimeRangeWithAnnotations;

    const switchSub = this.subscribeToEvent(EventSwitchTimerangeSelectionMode, (event) => {
      // this triggers a timeseries request to the API
      // TODO: caching?
      $annotationTimeRange.setState({
        mode:
          event.payload.mode === TimerangeSelectionMode.FLAMEGRAPH
            ? TimeRangeWithAnnotationsMode.ANNOTATIONS
            : TimeRangeWithAnnotationsMode.DEFAULT,
      });
    });

    const annotationTimeRangeSub = $annotationTimeRange.subscribeToState((newState, prevState) => {
      if (this.state.timeRangeSyncEnabled && newState.annotationTimeRange !== prevState.annotationTimeRange) {
        this.publishEvent(
          new EventSyncTimeRanges({ source: target, annotationTimeRange: newState.annotationTimeRange }),
          true
        );
      }
    });

    const timeRangeSub = $timeRange.subscribeToState((newState, prevState) => {
      if (newState.from !== prevState.from || newState.to !== prevState.to) {
        this.updateTitle('');

        if (this.state.timeRangeSyncEnabled) {
          this.publishEvent(new EventSyncTimeRanges({ source: target, timeRange: newState }), true);
        }
      }
    });

    return {
      unsubscribe() {
        timeRangeSub.unsubscribe();
        annotationTimeRangeSub.unsubscribe();
        switchSub.unsubscribe();
      },
    };
  }

  buildTimeseriesTitle() {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const { description } = getProfileMetric(profileMetricId as ProfileMetricId);
    return description || getProfileMetricLabel(profileMetricId);
  }

  useDiffTimeRange() {
    return (this.state.timeseriesPanel.state.body.state.$timeRange as SceneTimeRangeWithAnnotations).useState();
  }

  applyPreset({ from, to, diffFrom, diffTo, label }: Preset) {
    this.setDiffRange(diffFrom, diffTo);

    this.setTimeRange(buildTimeRange(from, to));

    this.updateTitle(label);
  }

  setTimeRange(newTimeRange: SceneTimeRangeState) {
    const { from, to } = this.state.$timeRange.state.value;

    if (!from.isSame(newTimeRange.value.from) || !to.isSame(newTimeRange.value.to)) {
      this.state.$timeRange.setState(newTimeRange);
    }
  }

  setDiffRange(diffFrom: string, diffTo: string) {
    const $diffTimeRange = this.state.timeseriesPanel.state.body.state.$timeRange as SceneTimeRangeWithAnnotations;
    const { annotationTimeRange } = $diffTimeRange.state;

    if (!annotationTimeRange.from.isSame(diffFrom) || !annotationTimeRange.to.isSame(diffTo)) {
      $diffTimeRange.setAnnotationTimeRange($diffTimeRange.buildAnnotationTimeRange(diffFrom, diffTo), true);
    }
  }

  /**
   * This function is responsible for automatically selecting half of the time range (from the time picker) that will be used to build the diff flame graph
   * For the baseline panel, the leftmost part, for the comparison one, the rightmost part.
   * In the future, we might want to be smarter and provides a way to select (e.g.) the region with the lowest resource consumption on the baseline panel vs
   * the region with the highest consumption on the comparison panel.
   */
  autoSelectDiffRange(selectWholeRange: boolean) {
    const { $timeRange, target } = this.state;
    const { from, to } = $timeRange.state.value;

    if (selectWholeRange) {
      this.setDiffRange(from.toISOString(), to.toISOString());
      return;
    }

    const diff = to.diff(from);

    // ensure that we don't kill the backend when selecting long periods like 7d
    const range = Math.min(Math.round(diff * 0.25), ONE_DAY_IN_MS);

    if (target === CompareTarget.BASELINE) {
      // we have to create a new instance because add() mutates the original one
      this.setDiffRange(from.toISOString(), dateTime(from).add(range).toISOString());
    } else {
      // we have to create a new instance because subtract() mutates the original one
      this.setDiffRange(dateTime(to).subtract(range).toISOString(), to.toISOString());
    }
  }

  updateTitle(label = '') {
    const title = this.state.target === CompareTarget.BASELINE ? 'Baseline' : 'Comparison';
    const newTitle = label ? `${title} (${label})` : title;

    this.setState({ title: newTitle });
  }

  onClickTimeRangeSync = () => {
    const { target, timeRangeSyncEnabled, $timeRange, timeseriesPanel } = this.state;
    const $annotationTimeRange = timeseriesPanel.state.body.state.$timeRange as SceneTimeRangeWithAnnotations;

    this.publishEvent(
      new EventEnableSyncTimeRanges({
        source: target,
        enable: !timeRangeSyncEnabled,
        timeRange: $timeRange.state,
        annotationTimeRange: $annotationTimeRange.state.annotationTimeRange,
      }),
      true
    );
  };

  toggleTimeRangeSync(timeRangeSyncEnabled: boolean) {
    this.setState({ timeRangeSyncEnabled });
  }

  public static Component = ({ model }: SceneComponentProps<SceneComparePanel>) => {
    const {
      target,
      color,
      title,
      timeseriesPanel: timeseries,
      timePicker,
      refreshPicker,
      filterKey,
      timeRangeSyncEnabled,
    } = model.useState();

    const styles = useStyles2(getStyles, color);

    const filtersVariable = sceneGraph.findByKey(model, filterKey) as FiltersVariable;

    return (
      <div className={styles.panel} data-testid={`panel-${target}`}>
        <div className={styles.panelHeader}>
          <h6>
            <div className={styles.colorCircle} />
            {title}
          </h6>

          <div className={styles.timeControls}>
            <timePicker.Component model={timePicker} />
            <refreshPicker.Component model={refreshPicker} />
            <IconButton
              className={cx(styles.syncButton, timeRangeSyncEnabled && 'active')}
              name="link"
              aria-label={timeRangeSyncEnabled ? 'Unsync time ranges' : 'Sync time ranges'}
              tooltip={timeRangeSyncEnabled ? 'Unsync time ranges' : 'Sync time ranges'}
              onClick={model.onClickTimeRangeSync}
            />
          </div>
        </div>

        <div className={styles.filter}>
          <filtersVariable.Component model={filtersVariable} />
        </div>

        <div className={styles.timeseries}>{timeseries && <timeseries.Component model={timeseries} />}</div>
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2, color: string) => ({
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
    flex-wrap: wrap;

    & > h6 {
      font-size: 15px;
      height: 32px;
      line-height: 32px;
      margin: 0 ${theme.spacing(1)} 0 0;
    }
  `,
  colorCircle: css`
    display: inline-block;
    background-color: ${color};
    border-radius: 50%;
    width: 9px;
    height: 9px;
    margin-right: 6px;
  `,
  timeControls: css`
    display: flex;
    justify-content: flex-end;
    gap: 4px;
  `,
  syncButton: css`
    z-index: unset;
    padding: ${theme.spacing(0, 1)};
    margin: 0;
    background: ${theme.colors.secondary.main};
    border: 1px solid ${theme.colors.secondary.border};
    border-radius: ${theme.shape.radius.default};

    &:hover {
      background: ${theme.colors.secondary.shade};
    }

    &.active {
      color: ${theme.colors.primary.text};
      border: 1px solid ${theme.colors.primary.text};
    }
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

    & [data-viz-panel-key] [data-testid='uplot-main-div'] {
      cursor: crosshair;
    }
  `,
});
