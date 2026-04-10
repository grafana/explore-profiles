import { isDateTime, rangeUtil, TimeRange } from '@grafana/data';
import { SceneComponentProps, sceneGraph, SceneTimePicker } from '@grafana/scenes';
import { TimeRangePicker } from '@grafana/ui';
import { uniqBy } from 'lodash';
import React, { useCallback, useState } from 'react';

import { setActiveTimePicker } from '../../../services/keyboardShortcuts';

const HISTORY_LOCAL_STORAGE_KEY = 'grafana.dashboard.timepicker.history';

function readHistory(): TimeRange[] {
  try {
    const raw = localStorage.getItem(HISTORY_LOCAL_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const values = JSON.parse(raw);
    return values.map((item: { from: string; to: string }) =>
      rangeUtil.convertRawToRange(item, 'utc', undefined, 'YYYY-MM-DD HH:mm:ss')
    );
  } catch {
    return [];
  }
}

function writeHistory(values: TimeRange[]) {
  localStorage.setItem(
    HISTORY_LOCAL_STORAGE_KEY,
    JSON.stringify(
      uniqBy(
        values.map((v) => ({
          from: typeof v.raw.from === 'string' ? v.raw.from : v.raw.from.toISOString(),
          to: typeof v.raw.to === 'string' ? v.raw.to : v.raw.to.toISOString(),
        })),
        (v) => v.from + v.to
      ).slice(0, 4)
    )
  );
}

export class SceneTimePickerWithoutSync extends SceneTimePicker {
  public static Component = function SceneTimePickerRenderer({
    model,
  }: SceneComponentProps<SceneTimePickerWithoutSync>) {
    const { hidePicker, isOnCanvas } = model.useState();
    const timeRange = sceneGraph.getTimeRange(model);
    const timeZone = timeRange.getTimeZone();
    const timeRangeState = timeRange.useState();

    const [, setRenderCount] = useState(0);

    const handleClick = useCallback(() => {
      setActiveTimePicker(model);
      setRenderCount((n) => n + 1);
    }, [model]);

    if (hidePicker) {
      return null;
    }

    return (
      <div onClick={handleClick}>
        <TimeRangePicker
          isOnCanvas={isOnCanvas ?? true}
          value={timeRangeState.value}
          onChange={(range) => {
            if (isDateTime(range.raw.from) || isDateTime(range.raw.to)) {
              writeHistory([range, ...readHistory()]);
            }
            timeRange.onTimeRangeChange(range);
          }}
          timeZone={timeZone}
          fiscalYearStartMonth={timeRangeState.fiscalYearStartMonth}
          onMoveBackward={model.onMoveBackward}
          onMoveForward={model.onMoveForward}
          onZoom={model.onZoom}
          onChangeTimeZone={timeRange.onTimeZoneChange}
          onChangeFiscalYearStartMonth={model.onChangeFiscalYearStartMonth}
          history={readHistory()}
          isSynced={false}
        />
      </div>
    );
  };
}
