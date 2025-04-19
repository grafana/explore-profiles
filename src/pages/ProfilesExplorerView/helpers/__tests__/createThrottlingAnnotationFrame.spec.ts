import { DataFrame, DataTopic, DateTime, Field, FieldType, LoadingState, PanelData } from '@grafana/data';

import { createThrottlingAnnotationFrame } from '../createThrottlingAnnotationFrame';

describe('createThrottlingAnnotationFrame', () => {
  const mockTime = 1234567890000;
  const mockLimitResetTime = Math.floor(mockTime / 1000) + 3600; // 1 hour later

  beforeAll(() => {
    jest.spyOn(Date, 'now').mockImplementation(() => mockTime);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should create annotation frame from throttling annotations', () => {
    const mockPanelData: PanelData = {
      series: [
        {
          fields: [
            {
              name: 'time',
              type: FieldType.time,
              values: [mockTime],
              config: {},
            } as Field<number>,
            {
              name: 'value',
              type: FieldType.number,
              values: [100],
              config: {},
            } as Field<number>,
            {
              name: 'annotations',
              type: FieldType.other,
              values: [
                [
                  {
                    key: 'pyroscope.ingest.throttled',
                    value: JSON.stringify({
                      body: {
                        periodType: 'day',
                        periodLimitMb: 1024,
                        limitResetTime: mockLimitResetTime,
                        samplingPeriodSec: 60,
                        samplingRequests: 1,
                        usageGroup: '',
                      },
                    }),
                  },
                ],
              ],
              config: {},
            } as Field,
          ],
          length: 1,
        } as DataFrame,
      ],
      state: LoadingState.Done,
      timeRange: {
        from: mockTime as unknown as DateTime,
        to: mockTime as unknown as DateTime,
        raw: {
          from: mockTime as unknown as DateTime,
          to: mockTime as unknown as DateTime,
        },
      },
    };

    const result = createThrottlingAnnotationFrame(mockPanelData);

    expect(result.fields).toHaveLength(5);
    expect(result.fields[0].name).toBe('time');
    expect(result.fields[0].values[0]).toBe(mockTime);
    expect(result.fields[1].name).toBe('timeEnd');
    expect(result.fields[1].values[0]).toBe(mockLimitResetTime * 1000);
    expect(result.fields[3].name).toBe('text');
    expect(result.fields[3].values[0]).toBe('Ingestion limit of 1 GiB/day reached');
    expect(result.fields[4].name).toBe('isRegion');
    expect(result.fields[4].values[0]).toBe(false);
    expect(result.meta?.dataTopic).toBe(DataTopic.Annotations);
  });

  it('should handle empty annotations array', () => {
    const mockPanelData: PanelData = {
      series: [
        {
          fields: [
            {
              name: 'time',
              type: FieldType.time,
              values: [mockTime],
              config: {},
            } as Field<number>,
            {
              name: 'value',
              type: FieldType.number,
              values: [100],
              config: {},
            } as Field<number>,
            {
              name: 'annotations',
              type: FieldType.other,
              values: [[]],
              config: {},
            } as Field,
          ],
          length: 1,
        } as DataFrame,
      ],
      state: LoadingState.Done,
      timeRange: {
        from: mockTime as unknown as DateTime,
        to: mockTime as unknown as DateTime,
        raw: {
          from: mockTime as unknown as DateTime,
          to: mockTime as unknown as DateTime,
        },
      },
    };

    const result = createThrottlingAnnotationFrame(mockPanelData);
    expect(result.fields[0].values.length).toBe(0);
  });

  it('should ignore unsupported annotation types', () => {
    const mockPanelData: PanelData = {
      series: [
        {
          fields: [
            {
              name: 'time',
              type: FieldType.time,
              values: [mockTime],
              config: {},
            } as Field<number>,
            {
              name: 'value',
              type: FieldType.number,
              values: [100],
              config: {},
            } as Field<number>,
            {
              name: 'annotations',
              type: FieldType.other,
              values: [
                [
                  {
                    key: 'unsupported.annotation.type',
                    value: JSON.stringify({ some: 'data' }),
                  },
                ],
              ],
              config: {},
            } as Field,
          ],
          length: 1,
        } as DataFrame,
      ],
      state: LoadingState.Done,
      timeRange: {
        from: mockTime as unknown as DateTime,
        to: mockTime as unknown as DateTime,
        raw: {
          from: mockTime as unknown as DateTime,
          to: mockTime as unknown as DateTime,
        },
      },
    };

    const result = createThrottlingAnnotationFrame(mockPanelData);
    expect(result.fields[0].values.length).toBe(0);
  });

  it('should handle series without annotations field', () => {
    const mockPanelData: PanelData = {
      series: [
        {
          fields: [
            {
              name: 'time',
              type: FieldType.time,
              values: [mockTime],
              config: {},
            } as Field<number>,
            {
              name: 'value',
              type: FieldType.number,
              values: [100],
              config: {},
            } as Field<number>,
          ],
          length: 1,
        } as DataFrame,
      ],
      state: LoadingState.Done,
      timeRange: {
        from: mockTime as unknown as DateTime,
        to: mockTime as unknown as DateTime,
        raw: {
          from: mockTime as unknown as DateTime,
          to: mockTime as unknown as DateTime,
        },
      },
    };

    const result = createThrottlingAnnotationFrame(mockPanelData);
    expect(result.fields[0].values.length).toBe(0);
  });

  it('should deduplicate annotations with same reset time', () => {
    const mockPanelData: PanelData = {
      series: [
        {
          fields: [
            {
              name: 'time',
              type: FieldType.time,
              values: [mockTime, mockTime + 1000],
              config: {},
            } as Field<number>,
            {
              name: 'value',
              type: FieldType.number,
              values: [100, 200],
              config: {},
            } as Field<number>,
            {
              name: 'annotations',
              type: FieldType.other,
              values: [
                [
                  {
                    key: 'pyroscope.ingest.throttled',
                    value: JSON.stringify({
                      body: {
                        periodType: 'day',
                        periodLimitMb: 1024,
                        limitResetTime: mockLimitResetTime,
                        samplingPeriodSec: 60,
                        samplingRequests: 1,
                        usageGroup: '',
                      },
                    }),
                  },
                ],
                [
                  {
                    key: 'pyroscope.ingest.throttled',
                    value: JSON.stringify({
                      body: {
                        periodType: 'day',
                        periodLimitMb: 1024,
                        limitResetTime: mockLimitResetTime,
                        samplingPeriodSec: 60,
                        samplingRequests: 1,
                        usageGroup: '',
                      },
                    }),
                  },
                ],
              ],
              config: {},
            } as Field,
          ],
          length: 2,
        } as DataFrame,
      ],
      state: LoadingState.Done,
      timeRange: {
        from: mockTime as unknown as DateTime,
        to: mockTime as unknown as DateTime,
        raw: {
          from: mockTime as unknown as DateTime,
          to: mockTime as unknown as DateTime,
        },
      },
    };

    const result = createThrottlingAnnotationFrame(mockPanelData);
    expect(result.fields[0].values.length).toBe(1);
  });
});
