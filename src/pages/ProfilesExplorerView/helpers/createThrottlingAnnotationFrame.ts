import {
  createDataFrame,
  DataFrameDTO,
  DataTopic,
  FieldType,
  formattedValueToString,
  getValueFormat,
  PanelData,
} from '@grafana/data';

const formatSize = (size: number) => formattedValueToString(getValueFormat('bytes')(size));

interface RawProfileAnnotation {
  key: string;
  value: string;
}

enum ProfileAnnotationKey {
  Throttled = 'pyroscope.ingest.throttled',
}

interface ProfileAnnotation {
  body: ProfileThrottledAnnotation;
}

interface ProfileThrottledAnnotation {
  periodType: string;
  periodLimitMb: number;
  limitResetTime: number;
  samplingPeriodSec: number;
  samplingRequests: number;
  usageGroup: string;
}

interface AnnotationData {
  times: number[];
  timeEnds: number[];
  texts: string[];
  isRegion: boolean[];
}

function processThrottlingAnnotation(
  annotation: RawProfileAnnotation,
  currentKey: number | undefined
): { text: string; timeEnd: number; isRegion: boolean; key: number } | null {
  if (annotation.key !== ProfileAnnotationKey.Throttled) {
    // currently we only support throttling annotations
    // this can get refactored once we add more annotation types
    return null;
  }

  const profileAnnotation = JSON.parse(annotation.value) as ProfileAnnotation;
  const throttlingInfo = profileAnnotation.body;

  if (currentKey === throttlingInfo.limitResetTime) {
    return null;
  }

  const limit = formatSize(throttlingInfo.periodLimitMb * 1024 * 1024);
  return {
    text: `Ingestion limit of ${limit}/${throttlingInfo.periodType} reached`,
    timeEnd: throttlingInfo.limitResetTime * 1000,
    isRegion: throttlingInfo.limitResetTime < Math.floor(Date.now() / 1000),
    key: throttlingInfo.limitResetTime,
  };
}

function collectThrottlingAnnotationData(data: PanelData): AnnotationData {
  const result: AnnotationData = {
    times: [],
    timeEnds: [],
    texts: [],
    isRegion: [],
  };

  data.series.forEach((s) => {
    if (s.fields.length <= 2 || s.fields[2].name !== 'annotations') {
      return;
    }

    let key: number | undefined;
    s.fields[2].values.forEach((annotations: RawProfileAnnotation[], i) => {
      if (!annotations) {
        return;
      }

      annotations.forEach((a) => {
        const processed = processThrottlingAnnotation(a, key);

        if (processed) {
          result.times.push(s.fields[0].values[i]);
          result.timeEnds.push(processed.timeEnd);
          result.isRegion.push(processed.isRegion);
          result.texts.push(processed.text);
          key = processed.key;
        }
      });
    });
  });

  return result;
}

export function createThrottlingAnnotationFrame(data: PanelData) {
  const { times, timeEnds, texts, isRegion } = collectThrottlingAnnotationData(data);

  const fields = [
    { name: 'time', type: FieldType.time, values: times },
    { name: 'timeEnd', type: FieldType.time, values: timeEnds },
    { name: 'color', type: FieldType.other, values: [] },
    { name: 'text', type: FieldType.string, values: texts },
    { name: 'isRegion', type: FieldType.boolean, values: isRegion },
  ];

  const frame: DataFrameDTO = {
    name: 'annotations',
    fields,
  };

  const annotationFrame = createDataFrame(frame);
  annotationFrame.meta = {
    dataTopic: DataTopic.Annotations,
  };

  return annotationFrame;
}
