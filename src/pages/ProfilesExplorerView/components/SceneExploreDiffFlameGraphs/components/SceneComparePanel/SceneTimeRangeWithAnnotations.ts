import { getDefaultTimeRange, TimeRange } from '@grafana/data';
import { sceneGraph, SceneObjectBase, SceneTimeRangeLike, SceneTimeRangeState } from '@grafana/scenes';

export enum TimeRangeWithAnnotationsMode {
  ANNOTATIONS = 'annotations',
  DEFAULT = 'default',
}

interface SceneTimeRangeWithAnnotationsState extends SceneTimeRangeState {
  alternateTimeRange: TimeRange;
  onTimeRangeChange?: (timeRange: TimeRange) => void;
  mode: TimeRangeWithAnnotationsMode;
}

export class SceneTimeRangeWithAnnotations
  extends SceneObjectBase<SceneTimeRangeWithAnnotationsState>
  implements SceneTimeRangeLike
{
  constructor(
    state: Omit<
      SceneTimeRangeWithAnnotationsState,
      'mode' | 'from' | 'to' | 'value' | 'timeZone' | 'alternateTimeRange'
    > = {}
  ) {
    super({
      ...state,
      // We set a default time range here. It will be overwritten on activation based on ancestor time range.
      from: 'now-6h',
      to: 'now',
      value: getDefaultTimeRange(),
      alternateTimeRange: getDefaultTimeRange(),
      mode: TimeRangeWithAnnotationsMode.ANNOTATIONS,
    });

    this.addActivationHandler(() => {
      const timeRange = this.realTimeRange;

      this.setState({
        ...timeRange.state,
        alternateTimeRange: timeRange.state.value,
      });

      this._subs.add(timeRange.subscribeToState((newState) => this.setState(newState)));
    });
  }

  changeMode(newMode: TimeRangeWithAnnotationsMode) {
    this.setState({ mode: newMode });
  }

  private get realTimeRange() {
    const parentsceneObject = this.parent;
    if (!parentsceneObject?.parent) {
      throw Error('A time range change override will not function if it is on a scene with no parent.');
    }
    return sceneGraph.getTimeRange(parentsceneObject?.parent);
  }

  onTimeRangeChange(timeRange: TimeRange): void {
    if (this.state.mode === TimeRangeWithAnnotationsMode.DEFAULT) {
      this.realTimeRange.onTimeRangeChange(timeRange);
      return;
    }

    this.setState({ alternateTimeRange: timeRange });
    this.state.onTimeRangeChange?.(timeRange);
  }

  onTimeZoneChange(timeZone: string): void {
    this.realTimeRange.onTimeZoneChange(timeZone);
  }

  getTimeZone(): string {
    return this.realTimeRange.getTimeZone();
  }

  onRefresh(): void {
    this.realTimeRange.onRefresh();
  }
}
