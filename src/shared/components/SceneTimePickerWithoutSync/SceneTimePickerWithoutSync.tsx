import { SceneComponentProps, sceneGraph, SceneTimePicker } from '@grafana/scenes';
import { TimeRangePicker } from '@grafana/ui';
import React, { useCallback } from 'react';

import { setActiveTimePicker } from '../../../services/keyboardShortcuts';

export class SceneTimePickerWithoutSync extends SceneTimePicker {
  public static Component = function SceneTimePickerRenderer({
    model,
  }: SceneComponentProps<SceneTimePickerWithoutSync>) {
    const { hidePicker, isOnCanvas } = model.useState();
    const timeRange = sceneGraph.getTimeRange(model);
    const timeZone = timeRange.getTimeZone();
    const timeRangeState = timeRange.useState();

    const handleClick = useCallback(() => {
      setActiveTimePicker(model);
    }, [model]);

    if (hidePicker) {
      return null;
    }

    return (
      <div onClick={handleClick}>
        <TimeRangePicker
          isOnCanvas={isOnCanvas ?? true}
          value={timeRangeState.value}
          onChange={timeRange.onTimeRangeChange}
          timeZone={timeZone}
          fiscalYearStartMonth={timeRangeState.fiscalYearStartMonth}
          onMoveBackward={model.onMoveBackward}
          onMoveForward={model.onMoveForward}
          onZoom={model.onZoom}
          onChangeTimeZone={timeRange.onTimeZoneChange}
          onChangeFiscalYearStartMonth={model.onChangeFiscalYearStartMonth}
          // disable the sync
          isSynced={false}
        />
      </div>
    );
  };
}
