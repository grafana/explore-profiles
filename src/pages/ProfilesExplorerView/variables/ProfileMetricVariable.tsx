import { CustomVariable, MultiValueVariable, SceneComponentProps, sceneGraph } from '@grafana/scenes';
import { Cascader, CascaderOption, Select } from '@grafana/ui';
import { noOp } from '@shared/domain/noOp';
import { ProfileMetric } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import { Services } from '@shared/infrastructure/services/servicesApiClient';
import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
import React, { useMemo } from 'react';

export class ProfileMetricVariable extends CustomVariable {
  static DEFAULT_VALUE = 'process_cpu:cpu:nanoseconds:cpu:nanoseconds';

  constructor() {
    super({
      name: 'profileMetricId',
      isMulti: false,
      label: '🔥 Profile',
    });
  }

  static buildProfileMetricOptions(services: Services) {
    const allProfileMetricsMap = new Map<ProfileMetric['id'], ProfileMetric>();

    for (const profileMetrics of services.values()) {
      for (const [id, metric] of profileMetrics) {
        allProfileMetricsMap.set(id, metric);
      }
    }

    const allProfileMetrics = Array.from(allProfileMetricsMap.values())
      .sort((a, b) => a.type.localeCompare(b.type))
      .map(({ id, type, group }) => ({
        value: id,
        label: `${type} (${group})`,
        type,
        group,
      }));

    return allProfileMetrics;
  }

  static buildCascaderOptions(
    options: Array<{ group: string; label: string; type: string; value: string }>
  ): CascaderOption[] {
    const optionsMap = new Map();

    for (const { value, group, type } of options) {
      const nameSpaceServices = optionsMap.get(group) || {
        value: group,
        label: group,
        items: [],
      };

      const items = nameSpaceServices.items || [];

      items.push({
        value,
        label: type,
      });

      nameSpaceServices.items = items;

      optionsMap.set(group, nameSpaceServices);
    }

    return Array.from(optionsMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  }

  static Component = ({ model }: SceneComponentProps<MultiValueVariable>) => {
    const { value } = model.useState();

    const timeRangeState = sceneGraph.getTimeRange(model).useState();

    // TODO: handle fetch error?
    // hack because SceneTimeRange updates the URL in UTC format (e.g. 2024-05-21T10:58:03.805Z)
    const { services, isFetching } = useFetchServices({
      timeRange: {
        raw: {
          from: timeRangeState.value.from,
          to: timeRangeState.value.to,
        },
        from: timeRangeState.value.from,
        to: timeRangeState.value.to,
      },
    });

    const options = useMemo(
      () => ProfileMetricVariable.buildCascaderOptions(ProfileMetricVariable.buildProfileMetricOptions(services)),
      [services]
    );

    function onSelect(newValue: any) {
      model.changeValueTo(newValue, newValue);
    }

    if (!value && options.length) {
      onSelect(ProfileMetricVariable.DEFAULT_VALUE);
    }

    // hack to ensure that the Cascader initial value is set :man_shrug:
    return !isFetching ? (
      <Cascader
        aria-label="Profile metrics list"
        width={32}
        separator="/"
        displayAllSelectedLevels
        placeholder={`Select a profile metric (${options.length})`}
        options={options}
        initialValue={value as string}
        changeOnSelect={false}
        onSelect={onSelect}
      />
    ) : (
      <Select
        aria-label="Profile metrics list"
        width={32}
        placeholder="Loading metrics..."
        options={[]}
        onChange={noOp}
      />
    );
  };
}
