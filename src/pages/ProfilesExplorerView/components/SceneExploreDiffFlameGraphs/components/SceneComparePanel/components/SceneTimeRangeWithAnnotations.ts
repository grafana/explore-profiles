import { dateTime, TimeRange } from '@grafana/data';
import { sceneGraph, SceneObjectBase, SceneTimeRangeLike, SceneTimeRangeState, VizPanel } from '@grafana/scenes';

import { EventAnnotationTimeRangeChanged } from '../domain/events/EventAnnotationTimeRangeChanged';
import { getDefaultTimeRange } from '../domain/getDefaultTimeRange';
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
        raw: { from: dateTime(0), to: dateTime(0) },
      },
      annotationColor,
      annotationTitle,
      mode,
    });

    this.addActivationHandler(this.onActivate.bind(this));
  }

  onActivate() {
    const ancestorTimeRangeObject = this.getAncestorTimeRange();

    this.setState({
      ...ancestorTimeRangeObject.state,
      // TODO
      // annotationTimeRange: ancestorTimeRangeObject.state.value,
    });

    this._subs.add(ancestorTimeRangeObject.subscribeToState((newState) => this.setState(newState)));

    const { $data } = this.getTimeseriesPanel().state;

    this._subs.add(
      $data?.subscribeToState((newState, prevState) => {
        if (newState.data && !newState.data.annotations?.length && prevState.data?.annotations?.length) {
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

  protected getTimeseriesPanel(): VizPanel {
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

    const { $data } = this.getTimeseriesPanel().state;

    const data = $data?.state.data;
    if (!data || !annotationTimeRange) {
      return;
    }

    const annotation = new RangeAnnotation();

    annotation.addRange({
      color: annotationColor,
      text: annotationTitle,
      time: annotationTimeRange.from.unix() * 1000,
      timeEnd: annotationTimeRange.to.unix() * 1000,
    });

    $data?.setState({
      data: {
        ...data,
        annotations: [annotation],
      },
    });
  }

  onTimeRangeChange(timeRange: TimeRange): void {
    const { mode, annotationTimeRange } = this.state;

    if (mode === TimeRangeWithAnnotationsMode.DEFAULT) {
      this.getAncestorTimeRange().onTimeRangeChange(timeRange);
      return;
    }

    // we don't do this.setState({ annotationTimeRange: timeRange });
    // because it would cause a ttimeseries query to be made to the API
    annotationTimeRange.from = timeRange.from;
    annotationTimeRange.to = timeRange.to;
    annotationTimeRange.raw = timeRange.raw;

    this.publishEvent(new EventAnnotationTimeRangeChanged({ timeRange }), true);

    this.updateTimeseriesAnnotation();
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
