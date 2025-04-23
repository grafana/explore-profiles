import {
  createDataFrame,
  DataFrame,
  DataFrameDTO,
  DataTopic,
  FieldType,
  formattedValueToString,
  getValueFormat,
  PanelData,
} from '@grafana/data';
import { logger } from '@shared/infrastructure/tracking/logger';
import { ProfileAnnotation, ProfileAnnotationKey, TimedAnnotation } from '@shared/types/ProfileAnnotation';

const formatSize = (size: number): string => formattedValueToString(getValueFormat('bytes')(size));

interface AnnotationData {
  times: number[];
  timeEnds: number[];
  texts: string[];
  isRegion: boolean[];
}

interface ProcessedAnnotation {
  text: string;
  time: number;
  timeEnd: number;
  isRegion: boolean;
  duplicateTracker: number;
}

function processThrottlingAnnotation(
  timedAnnotation: TimedAnnotation,
  duplicateTracker: number | undefined
): ProcessedAnnotation | undefined {
  if (timedAnnotation.annotation.key !== ProfileAnnotationKey.Throttled) {
    // currently we only support throttling annotations
    // this can get refactored once we add more annotation types
    return undefined;
  }

  try {
    const profileAnnotation = JSON.parse(timedAnnotation.annotation.value) as ProfileAnnotation;
    const throttlingInfo = profileAnnotation.body;

    if (duplicateTracker === throttlingInfo.limitResetTime) {
      return undefined;
    }

    const limit = formatSize(throttlingInfo.periodLimitMb * 1024 * 1024);
    return {
      text: `Ingestion limit (${limit}/${throttlingInfo.periodType}) reached`,
      time: timedAnnotation.timestamp,
      timeEnd: throttlingInfo.limitResetTime * 1000,
      isRegion: throttlingInfo.limitResetTime < Math.floor(Date.now() / 1000),
      duplicateTracker: throttlingInfo.limitResetTime,
    };
  } catch (error) {
    logger.error(error as Error, {
      info: 'Error while parsing annotation data',
    });
    return undefined;
  }
}

function processAnnotationFrameField(timedAnnotations: TimedAnnotation[], result: AnnotationData): number | undefined {
  let duplicateTracker: number | undefined = undefined;

  for (const timedAnnotation of timedAnnotations) {
    if (!timedAnnotation) {
      continue;
    }

    const processed = processThrottlingAnnotation(timedAnnotation, duplicateTracker);
    if (processed) {
      result.times.push(processed.time);
      result.timeEnds.push(processed.timeEnd);
      result.isRegion.push(processed.isRegion);
      result.texts.push(processed.text);
      duplicateTracker = processed.duplicateTracker;
    }
  }

  return duplicateTracker;
}

function collectThrottlingAnnotationData(data: PanelData): AnnotationData {
  const result: AnnotationData = {
    times: [],
    timeEnds: [],
    texts: [],
    isRegion: [],
  };

  if (!data.annotations?.length) {
    return result;
  }

  data.annotations.forEach((annotationFrame) => {
    if (!annotationFrame.fields.length || !annotationFrame.fields[0].values.length) {
      return;
    }

    processAnnotationFrameField(annotationFrame.fields[0].values[0], result);
  });

  return result;
}

export function createThrottlingAnnotationFrame(data: PanelData): DataFrame {
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
