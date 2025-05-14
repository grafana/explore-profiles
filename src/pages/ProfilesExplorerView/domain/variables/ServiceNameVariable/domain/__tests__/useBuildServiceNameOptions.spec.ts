import { CascaderOption } from '@grafana/ui';

import { buildServiceNameCascaderOptions } from '../useBuildServiceNameOptions';

describe('buildServiceNameCascaderOptions', () => {
  it('should return empty array for empty input', () => {
    const result = buildServiceNameCascaderOptions([]);
    expect(result).toEqual([]);
  });

  it('should build cascader options for single level service names', () => {
    const serviceNames = ['service1', 'service2'];
    const result = buildServiceNameCascaderOptions(serviceNames);

    const expected: CascaderOption[] = [
      { value: 'service1', label: 'service1' },
      { value: 'service2', label: 'service2' },
    ];

    expect(result).toEqual(expected);
  });

  it('should build cascader options for nested service names', () => {
    const serviceNames = ['service1/subservice1', 'service1/subservice2'];
    const result = buildServiceNameCascaderOptions(serviceNames);

    const expected: CascaderOption[] = [
      {
        value: 'service1/',
        label: 'service1',
        items: [
          { value: 'service1/subservice1', label: 'subservice1' },
          { value: 'service1/subservice2', label: 'subservice2' },
        ],
      },
    ];

    expect(result).toEqual(expected);
  });

  it('should build cascader options for deeply nested service names', () => {
    const serviceNames = ['service1/subservice1/endpoint1', 'service1/subservice1/endpoint2'];
    const result = buildServiceNameCascaderOptions(serviceNames);

    const expected: CascaderOption[] = [
      {
        value: 'service1/',
        label: 'service1',
        items: [
          {
            value: 'service1/subservice1/',
            label: 'subservice1',
            items: [
              { value: 'service1/subservice1/endpoint1', label: 'endpoint1' },
              { value: 'service1/subservice1/endpoint2', label: 'endpoint2' },
            ],
          },
        ],
      },
    ];

    expect(result).toEqual(expected);
  });

  it('should handle mixed depth with no overlaps', () => {
    const serviceNames = ['service1', 'service2/subservice1', 'service3/subservice1/endpoint1'];
    const result = buildServiceNameCascaderOptions(serviceNames);

    const expected: CascaderOption[] = [
      {
        value: 'service1',
        label: 'service1',
        items: undefined,
      },
      {
        value: 'service2/',
        label: 'service2',
        items: [{ value: 'service2/subservice1', label: 'subservice1' }],
      },
      {
        value: 'service3/',
        label: 'service3',
        items: [
          {
            value: 'service3/subservice1/',
            label: 'subservice1',
            items: [{ value: 'service3/subservice1/endpoint1', label: 'endpoint1' }],
          },
        ],
      },
    ];

    expect(result).toEqual(expected);
  });

  it('should handle mixed depth with overlap of service names', () => {
    const serviceNames = ['top-service', 'top-service/sub-service1', 'top-service/sub-service2'];
    const result = buildServiceNameCascaderOptions(serviceNames);

    const expected: CascaderOption[] = [
      {
        value: 'top-service',
        label: 'top-service',
        items: undefined,
      },
      {
        value: 'top-service/',
        label: 'top-service',
        items: [
          {
            label: 'sub-service1',
            value: 'top-service/sub-service1',
            items: undefined,
          },
          {
            label: 'sub-service2',
            value: 'top-service/sub-service2',
            items: undefined,
          },
        ],
      },
    ];

    expect(result).toEqual(expected);
  });
});
