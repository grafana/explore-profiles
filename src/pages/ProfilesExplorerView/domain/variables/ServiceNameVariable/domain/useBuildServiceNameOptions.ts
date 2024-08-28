import { CascaderOption } from '@grafana/ui';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function buildServiceNameCascaderOptions(serviceNames: string[]) {
  const options: CascaderOption[] = [];

  for (const serviceId of serviceNames) {
    // serviceId = ebpf/agent-logs/agent ; parts = [ebpf,agent-logs,agent]
    const parts = serviceId.split('/');

    let currentPart: string;
    const currentValues = [];
    let currentOptions = options;

    for (let level = 0; level < parts.length; level += 1) {
      currentPart = parts[level];
      currentValues.push(currentPart);
      const value = currentValues.join('/');

      const existingOption = currentOptions.find((o) => o.value === value);

      if (existingOption) {
        currentOptions = existingOption.items as CascaderOption[];
      } else {
        const newOption = {
          value,
          label: currentPart,
          // setting items only for non-terminal nodes is required by the Cascader component
          // without it, the initial value would not be properly set in the UI
          items: level < parts.length - 1 ? [] : undefined,
        };

        currentOptions.push(newOption);
        currentOptions = newOption.items || [];
      }
    }
  }

  return options;
}
