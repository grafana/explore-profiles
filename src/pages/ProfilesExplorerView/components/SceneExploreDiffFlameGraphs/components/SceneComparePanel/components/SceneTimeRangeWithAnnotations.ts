import { dateTime, TimeRange } from '@grafana/data';
import {
  sceneGraph,
  SceneObjectBase,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
  SceneTimeRangeLike,
  SceneTimeRangeState,
  VizPanel,
} from '@grafana/scenes';

import { evaluateTimeRange } from '../domain/evaluateTimeRange';
import { EventAnnotationTimeRangeChanged } from '../domain/events/EventAnnotationTimeRangeChanged';
import { getDefaultTimeRange } from '../domain/getDefaultTimeRange';
import { parseUrlParam } from '../domain/parseUrlParam';
import { RangeAnnotation } from '../domain/RangeAnnotation';

export enum TimeRangeWithAnnotationsMode {
  ANNOTATIONS = 'annotations',
  DEFAULT = 'default',
}

interface SceneTimeRangeWithAnnotationsState extends SceneTimeRangeState {
  annotationTimeRange: TimeRange;
  annotationColor: string;
  annotationTitle: string;
  mode: TimeRangeWithAnnotationsMode;
}

export class SceneTimeRangeWithAnnotations
  extends SceneObjectBase<SceneTimeRangeWithAnnotationsState>
  implements SceneTimeRangeLike
{
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['aFrom', 'aTo'] });

  constructor({
    annotationColor,
    annotationTitle,
    mode,
  }: {
    annotationColor: SceneTimeRangeWithAnnotationsState['annotationColor'];
    annotationTitle: SceneTimeRangeWithAnnotationsState['annotationTitle'];
    mode: SceneTimeRangeWithAnnotationsState['mode'];
  }) {
    const defaultTimeRange = getDefaultTimeRange();

    super({
      // temporary values, they will be updated in onActivate
      ...defaultTimeRange,
      annotationTimeRange: {
        from: dateTime(0),
        to: dateTime(0),
        raw: { from: '', to: '' },
      },
      annotationColor,
      annotationTitle,
      mode,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  getUrlState() {
    const { annotationTimeRange } = this.state;

    return {
      aFrom:
        typeof annotationTimeRange.raw.from === 'string'
          ? annotationTimeRange.raw.from
          : annotationTimeRange.raw.from.toISOString(),
      aTo:
        typeof annotationTimeRange.raw.to === 'string'
          ? annotationTimeRange.raw.to
          : annotationTimeRange.raw.to.toISOString(),
    };
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  updateFromUrl(values: SceneObjectUrlValues) {
    const { aFrom, aTo } = values;

    if (!aTo && !aFrom) {
      return;
    }

    const { annotationTimeRange } = this.state;

    this.setState({
      annotationTimeRange: evaluateTimeRange(
        parseUrlParam(aFrom) ?? annotationTimeRange.from,
        parseUrlParam(aTo) ?? annotationTimeRange.to,
        this.getTimeZone(),
        this.state.fiscalYearStartMonth,
        this.state.UNSAFE_nowDelay
      ),
    });
  }

  onActivate() {
    const ancestorTimeRangeObject = this.getAncestorTimeRange();

    this.setState({
      ...ancestorTimeRangeObject.state,
    });

    this._subs.add(ancestorTimeRangeObject.subscribeToState((newState) => this.setState(newState)));

    const { $data } = this.getTimeseries().state;

    this._subs.add(
      $data?.subscribeToState((newState, prevState) => {
        if (!newState.data) {
          return;
        }

        // add annotation for the first time
        if (!newState.data.annotations?.length && !prevState.data?.annotations?.length) {
          this.updateTimeseriesAnnotation();
          return;
        }

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

  protected updateTimeseriesAnnotation() {
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

    // tradeoff: this will trigger any $data subscribers even though the data itself hasn't changed
    $data?.setState({
      data: {
        ...data,
        annotations: [annotation],
      },
    });
  }

  onTimeRangeChange(timeRange: TimeRange): void {
    const { mode } = this.state;

    if (mode === TimeRangeWithAnnotationsMode.DEFAULT) {
      this.getAncestorTimeRange().onTimeRangeChange(timeRange);
      return;
    }

    // note: this update causes a timeseries query to be made to the API
    this.setState({
      annotationTimeRange: timeRange,
    });

    this.updateTimeseriesAnnotation();

    this.publishEvent(new EventAnnotationTimeRangeChanged({ timeRange }), true);
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
