import { css } from '@emotion/css';
import { dateTime, FieldType, GrafanaTheme2, MutableDataFrame } from '@grafana/data';
import {
  PanelBuilders,
  SceneComponentProps,
  sceneGraph,
  SceneObjectBase,
  SceneObjectState,
  SceneQueryRunner,
  SceneTimePicker,
  SceneTimeRange,
  SceneTimeRangeState,
  VariableDependencyConfig,
  VizPanel,
} from '@grafana/scenes';
import { GraphGradientMode, InlineLabel, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';
import { BASELINE_COLORS, COMPARISON_COLORS } from 'src/pages/ComparisonView/ui/colors';
import { FiltersVariable } from 'src/pages/ProfilesExplorerView/domain/variables/FiltersVariable/FiltersVariable';
import { findSceneObjectByClass } from 'src/pages/ProfilesExplorerView/helpers/findSceneObjectByClass';
import { getSceneVariableValue } from 'src/pages/ProfilesExplorerView/helpers/getSceneVariableValue';
import { PYROSCOPE_DATA_SOURCE } from 'src/pages/ProfilesExplorerView/infrastructure/pyroscope-data-sources';
import { getProfileMetricLabel } from 'src/pages/ProfilesExplorerView/infrastructure/series/helpers/getProfileMetricLabel';

import { CompareTarget } from '../../SceneExploreServiceLabels/components/SceneGroupByLabels/components/SceneLabelValuesGrid/domain/types';
import { EventSwitchTimerangeSelectionType } from '../domain/events/EventSwitchTimerangeSelectionType';
import { SceneTimerangeSelectionTypeSwitcher } from './SceneTimerangeSelectionTypeSwitcher';

export interface SceneComparePanelState extends SceneObjectState {
  target: CompareTarget;
  title: string;
  filterKey: 'filtersBaseline' | 'filtersComparison';
  color: string;
  annotationColor: string;
  timePicker: SceneTimePicker;
  timeseries?: VizPanel;
}

function buildCompareTimeSeriesQueryRunner({ filterKey }: { filterKey: 'filtersBaseline' | 'filtersComparison' }) {
  return new SceneQueryRunner({
    datasource: PYROSCOPE_DATA_SOURCE,
    queries: [
      {
        refId: `$profileMetricId-$serviceName-${filterKey}}`,
        queryType: 'metrics',
        profileTypeId: '$profileMetricId',
        labelSelector: `{service_name="$serviceName",$${filterKey}}`,
      },
    ],
  });
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

class RangeAnnotation extends MutableDataFrame {
  constructor() {
    super();
    [
      {
        name: 'time',
        type: FieldType.time,
      },
      {
        name: 'timeEnd',
        type: FieldType.time,
      },
      {
        name: 'isRegion',
        type: FieldType.boolean,
      },
      {
        name: 'color',
        type: FieldType.other,
      },
      {
        name: 'text',
        type: FieldType.string,
      },
    ].forEach((field) => this.addField(field));
  }

  addRange(entry: { time: number; timeEnd: number; color?: string; text: string }) {
    this.add({ ...entry, isRegion: true });
  }
}

export class SceneComparePanel extends SceneObjectBase<SceneComparePanelState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['profileMetricId'],
    onVariableUpdateCompleted: () => {
      this.state.timeseries?.setState({
        title: this.buildTimeseriesTitle(),
      });
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
      timeseries: undefined,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const { filterKey, color, title, annotationColor } = this.state;

    this.subscribeToEvent(EventSwitchTimerangeSelectionType, (event) => {
      const { type } = event.payload;
      console.log('*** EventSwitchTimerangeSelectionType', event, type);
    });

    const timeseries = PanelBuilders.timeseries()
      .setTitle(this.buildTimeseriesTitle())
      .setData(buildCompareTimeSeriesQueryRunner({ filterKey }))
      .setHeaderActions([new SceneTimerangeSelectionTypeSwitcher()])
      .setColor({ mode: 'fixed', fixedColor: color })
      .setCustomFieldConfig('fillOpacity', 9)
      .setCustomFieldConfig('gradientMode', GraphGradientMode.Opacity)
      .setBehaviors([
        (vizPanel: VizPanel) => {
          const timeRange = findSceneObjectByClass(vizPanel, SceneTimeRange) as SceneTimeRange;
          console.log('*** behaviors', timeRange.state);
        },
      ])
      .build();

    this.setState({
      timeseries,
    });

    timeseries.state.$data?.subscribeToState((newState, prevState) => {
      console.log('*** newState', newState);
      if (!newState.data) {
        return;
      }

      if (!newState.data?.annotations?.length && !prevState.data?.annotations?.length) {
        const data = timeseries.state.$data?.state.data;
        if (!data) {
          return;
        }

        // Make new annotations, for the first time
        const annotation = new RangeAnnotation();
        const timeRange = (findSceneObjectByClass(this, SceneTimeRange) as SceneTimeRange).state.value;

        console.log('*** timeRange.from.unix()', timeRange.from.unix() * 1000);

        annotation.addRange({
          text: `${title} flame graph time range`,
          color: annotationColor,
          time: timeRange.from.unix() * 1000 + 30 * 1000,
          timeEnd: timeRange.to.unix() * 1000 - 30 * 1000,
        });

        timeseries.state.$data?.setState({
          data: {
            ...data,
            annotations: [annotation],
          },
        });
      } else if (!newState.data?.annotations?.length && prevState.data?.annotations?.length) {
        // We can just ensure we retain the old annotations if they exist
        newState.data.annotations = prevState.data.annotations;
      }
    });
  }

  buildTimeseriesTitle() {
    const profileMetricId = getSceneVariableValue(this, 'profileMetricId');
    const { description } = getProfileMetric(profileMetricId as ProfileMetricId);
    return description || getProfileMetricLabel(profileMetricId);
  }

  public static Component = ({ model }: SceneComponentProps<SceneComparePanel>) => {
    const styles = useStyles2(getStyles);
    const { title, timeseries, timePicker, filterKey } = model.useState();

    const filtersVariable = sceneGraph.findByKey(model, filterKey) as FiltersVariable;

    return (
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <h6>{title}</h6>

          <div className={styles.timePicker}>
            <timePicker.Component model={timePicker} />
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
