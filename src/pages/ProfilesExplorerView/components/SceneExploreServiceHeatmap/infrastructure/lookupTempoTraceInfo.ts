import { DataFrame, DataQuery, DataQueryRequest, DataQueryResponse, DataSourceApi, Field, TimeRange } from '@grafana/data';
import { getDataSourceSrv } from '@grafana/runtime';
import { lastValueFrom, Observable } from 'rxjs';

export interface TraceInfo {
  traceId: string;
  spanName?: string;
  duration?: number;
}

interface TempoSpanQuery extends DataQuery {
  queryType: 'traceql';
  tableType: 'spans';
  query: string;
  limit: number;
}

export async function lookupTempoTraceInfo(
  tempoDataSourceUid: string,
  spanIds: string[],
  timeRange: TimeRange
): Promise<Record<string, TraceInfo | null>> {
  const conditions = spanIds.map((id) => `span:id="${id}"`).join(' || ');
  const dataSource: DataSourceApi = await getDataSourceSrv().get(tempoDataSourceUid);
  const request: DataQueryRequest<TempoSpanQuery> = {
    requestId: 'span-trace-lookup',
    targets: [
      {
        refId: 'A',
        queryType: 'traceql',
        tableType: 'spans',
        query: `{${conditions}}`,
        limit: spanIds.length,
        datasource: { type: 'tempo', uid: tempoDataSourceUid },
      },
    ],
    range: timeRange,
    interval: '1s',
    intervalMs: 1000,
    maxDataPoints: spanIds.length,
    scopedVars: {},
    timezone: 'browser',
    app: 'explore',
    startTime: Date.now(),
  };
  const result = dataSource.query(request) as Observable<DataQueryResponse> | Promise<DataQueryResponse>;
  const response = result instanceof Promise ? await result : await lastValueFrom(result);
  return parseTraceInfo(response, spanIds);
}

function parseTraceInfo(response: DataQueryResponse, spanIds: string[]): Record<string, TraceInfo | null> {
  const traceInfoBySpanId: Record<string, TraceInfo | null> = {};

  for (const frame of response.data ?? []) {
    addFrameTraceInfo(frame, traceInfoBySpanId);
  }

  for (const spanId of spanIds) {
    traceInfoBySpanId[spanId] ??= null;
  }

  return traceInfoBySpanId;
}

function addFrameTraceInfo(frame: DataFrame, traceInfoBySpanId: Record<string, TraceInfo | null>) {
  const traceIdField = frame.fields.find((field: Field) => field.name === 'traceIdHidden');
  const spanIdField = frame.fields.find((field: Field) => field.name === 'spanID');
  const spanNameField = frame.fields.find((field: Field) => field.name === 'name');
  const durationField = frame.fields.find((field: Field) => field.name === 'duration');

  if (!traceIdField || !spanIdField) {
    return;
  }

  for (let index = 0; index < frame.length; index++) {
    const spanId = spanIdField.values[index];
    const traceId = traceIdField.values[index];
    if (spanId && traceId) {
      traceInfoBySpanId[spanId] = {
        traceId,
        spanName: spanNameField?.values[index],
        duration: durationField?.values[index],
      };
    }
  }
}
