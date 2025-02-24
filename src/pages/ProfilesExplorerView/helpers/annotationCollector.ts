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

interface ProfileAnnotation {
  type: ProfileAnnotationType;
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

enum ProfileAnnotationType {
  Throttled = 'throttled',
}

interface ProfileAnnotationContainer {
  bodies: string[];
}

interface AnnotationData {
  times: number[];
  timeEnds: number[];
  texts: string[];
  isRegion: boolean[];
}

function processThrottledAnnotation(
  annotation: ProfileAnnotation,
  currentKey: number | undefined
): { text: string; timeEnd: number; isRegion: boolean; key: number } | null {
  if (annotation.type !== ProfileAnnotationType.Throttled) {
    return null;
  }

  if (currentKey === annotation.body.limitResetTime) {
    return null;
  }

  const limit = formatSize(annotation.body.periodLimitMb * 1024 * 1024);
  return {
    text: `Ingestion limit of ${limit}/${annotation.body.periodType} reached`,
    timeEnd: annotation.body.limitResetTime * 1000,
    isRegion: annotation.body.limitResetTime < Math.floor(Date.now() / 1000),
    key: annotation.body.limitResetTime,
  };
}

function collectAnnotationData(data: PanelData): AnnotationData {
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
    s.fields[2].values.forEach((annotationContainer: ProfileAnnotationContainer, i) => {
      if (!annotationContainer) {
        return;
      }

      annotationContainer.bodies.forEach((body) => {
        const annotation = JSON.parse(body) as ProfileAnnotation;
        const processed = processThrottledAnnotation(annotation, key);

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

export function createAnnotationFrame(data: PanelData) {
  const { times, timeEnds, texts, isRegion } = collectAnnotationData(data);

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
