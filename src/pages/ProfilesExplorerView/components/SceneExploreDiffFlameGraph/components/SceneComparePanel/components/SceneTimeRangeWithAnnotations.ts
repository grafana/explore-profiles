import { DateTime, dateTime, LoadingState, TimeRange } from '@grafana/data';
import {
  sceneGraph,
  SceneObjectBase,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
  SceneTimeRangeLike,
  SceneTimeRangeState,
  VariableDependencyConfig,
  VizPanel,
} from '@grafana/scenes';
import { omit } from 'lodash';

import { evaluateTimeRange } from '../domain/evaluateTimeRange';
import { parseUrlParam } from '../domain/parseUrlParam';
import { RangeAnnotation } from '../domain/RangeAnnotation';

export enum TimeRangeWithAnnotationsMode {
  ANNOTATIONS = 'annotations',
  DEFAULT = 'default',
}

interface SceneTimeRangeWithAnnotationsState extends SceneTimeRangeState {
  annotationTimeRange: TimeRange;
  mode: TimeRangeWithAnnotationsMode;
  annotationColor: string;
  annotationTitle: string;
}

const TIMERANGE_NIL = {
  from: dateTime(0),
  to: dateTime(0),
  raw: { from: '', to: '' },
};

/**
 * This custom SceneTimeRange class provides the ability to draw annotations on timeseries vizualisations.
 * Indeed, timeseries visualizations don't support drawing annotations by dragging (it's only supported when holding ctrl/command key) so we need to hijack the zooming event to emulate drawing.
 * At the same time, the only way to hijack it is by passing custom $timeRange because TimeSeries vizualization handles zooming internally by looking for the nearest time range object.
 * @see https://github.com/grafana/scenes/pull/744
 */
export class SceneTimeRangeWithAnnotations
  extends SceneObjectBase<SceneTimeRangeWithAnnotationsState>
  implements SceneTimeRangeLike
{
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['dataSource', 'serviceName'],
    onReferencedVariableValueChanged: () => {
      this.nullifyAnnotationTimeRange();
      this.updateTimeseriesAnnotation();
    },
  });

  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['diffFrom', 'diffTo'] });

  constructor(options: {
    key: string;
    mode: TimeRangeWithAnnotationsMode;
    annotationColor: string;
    annotationTitle: string;
  }) {
    super({
      from: TIMERANGE_NIL.raw.from,
      to: TIMERANGE_NIL.raw.to,
      value: TIMERANGE_NIL,
      annotationTimeRange: TIMERANGE_NIL,
      ...options,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    this.setState(omit(this.getAncestorTimeRange().state, 'key'));

    this._subs.add(
      this.getAncestorTimeRange().subscribeToState((newState) => {
        this.setState(omit(newState, 'key'));
      })
    );

    this._subs.add(
      this.getTimeseries().state.$data?.subscribeToState((newState, prevState) => {
        if (!newState.data || newState.data.state !== LoadingState.Done) {
          return;
        }

        // add annotation for the first time
        if (!newState.data.annotations?.length && !prevState.data?.annotations?.length) {
          this.updateTimeseriesAnnotation();
          return;
        }

        // ensure we retain the previous annotations, if they exist
        if (!newState.data.annotations?.length && prevState.data?.annotations?.length) {
          newState.data.annotations = prevState.data.annotations;
        }
      })
    );
  }

  protected getAncestorTimeRange(): SceneTimeRangeLike {
    if (!this.parent || !this.parent.parent) {
      throw new Error(typeof this + ' must be used within $timeRange scope');
    }

    return sceneGraph.getTimeRange(this.parent.parent);
  }

  protected getTimeseries(): VizPanel {
    try {
      const vizPanel = sceneGraph.getAncestor(this, VizPanel);

      if (vizPanel.state.pluginId !== 'timeseries') {
        throw new TypeError('Incorrect VizPanel type!');
      }

      return vizPanel;
    } catch (error) {
      throw new Error('Ancestor timeseries panel not found!');
    }
  }

  updateTimeseriesAnnotation() {
    const { annotationTimeRange, annotationColor, annotationTitle } = this.state;

    const { $data } = this.getTimeseries().state;

    const data = $data?.state.data;
    if (!data) {
      return;
    }

    const annotation = new RangeAnnotation();

    annotation.addRange({
      color: annotationColor,
      text: annotationTitle,
      time: annotationTimeRange.from.unix() * 1000,
      timeEnd: annotationTimeRange.to.unix() * 1000,
    });

    // tradeoff: this will notify all the $data subscribers even though the data itself hasn't changed
    $data?.setState({
      data: {
        ...data,
        annotations: [annotation],
      },
    });
  }

  setAnnotationTimeRange(annotationTimeRange: TimeRange, updateTimeseries = false) {
    this.setState({ annotationTimeRange });

    if (updateTimeseries) {
      this.updateTimeseriesAnnotation();
    }
  }

  nullifyAnnotationTimeRange() {
    this.setAnnotationTimeRange(TIMERANGE_NIL);
  }

  getUrlState() {
    const { annotationTimeRange } = this.state;

    return {
      diffFrom:
        typeof annotationTimeRange.raw.from === 'string'
          ? annotationTimeRange.raw.from
          : annotationTimeRange.raw.from.toISOString(),
      diffTo:
        typeof annotationTimeRange.raw.to === 'string'
          ? annotationTimeRange.raw.to
          : annotationTimeRange.raw.to.toISOString(),
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const { diffFrom, diffTo } = values;

    if (!diffTo && !diffFrom) {
      return;
    }

    const { annotationTimeRange } = this.state;

    this.setAnnotationTimeRange(
      this.buildAnnotationTimeRange(
        parseUrlParam(diffFrom) ?? annotationTimeRange.from,
        parseUrlParam(diffTo) ?? annotationTimeRange.to
      )
    );
  }

  buildAnnotationTimeRange(diffFrom: string | DateTime, diffTo: string | DateTime) {
    return evaluateTimeRange(
      diffFrom,
      diffTo,
      this.getTimeZone(),
      this.state.fiscalYearStartMonth,
      this.state.UNSAFE_nowDelay
    );
  }

  onTimeRangeChange(timeRange: TimeRange): void {
    const { mode } = this.state;

    if (mode === TimeRangeWithAnnotationsMode.DEFAULT) {
      this.getAncestorTimeRange().onTimeRangeChange(timeRange);
      return;
    }

    // this triggers a timeseries request to the API
    // TODO: caching?
    this.setAnnotationTimeRange(timeRange, true);
  }

  onTimeZoneChange(timeZone: string): void {
    this.getAncestorTimeRange().onTimeZoneChange(timeZone);
  }

  getTimeZone(): string {
    return this.getAncestorTimeRange().getTimeZone();
  }

  onRefresh(): void {
    this.getAncestorTimeRange().onRefresh();
  }
}
