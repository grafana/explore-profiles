import { FieldColorModeId, FieldType, MutableDataFrame } from '@grafana/data';
import { stringifyPyroscopeColor } from '@shared/domain/translation';

import { TimelineData } from '../TimelineChartWrapper';

export function convertToDataFrame(data: TimelineData, format: 'bars' | 'lines', label?: string) {
  const custom = format === 'bars' ? { drawStyle: 'bars', fillOpacity: 100, barAlignment: 1 } : { drawStyle: 'lines' };

  const dataframe = new MutableDataFrame();
  dataframe.addField({ name: 'time', type: FieldType.time });
  // If there is no color, leave it as undefined so the default can be chosen
  const color = data?.color
    ? { mode: FieldColorModeId.Fixed, fixedColor: stringifyPyroscopeColor(data?.color) }
    : undefined;
  dataframe.addField({ name: label || ' ', type: FieldType.number, config: { unit: data.unit, custom, color } });

  const timeline = data.data;

  if (!timeline) {
    return dataframe;
  }

  const { durationDelta, samples, startTime } = timeline;

  // Prevents processing a timeline with undefined, null, or NaN time entries.
  if (Number.isNaN(Number(startTime)) || Number.isNaN(Number(durationDelta))) {
    console.error('The start time or duration delta is not defined. Ignoring timeline.', {
      startTime,
      durationDelta,
      label,
    });
    return dataframe;
  }

  for (let i = 0; i < samples.length; ++i) {
    const time = (startTime + i * durationDelta) * 1000; // Scale to milliseconds
    const sample = samples[i];

    dataframe.appendRow([time, sample]);
  }

  return dataframe;
}
