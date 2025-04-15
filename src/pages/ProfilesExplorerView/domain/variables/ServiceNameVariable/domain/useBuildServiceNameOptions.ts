import { CascaderOption } from '@grafana/ui';

// eslint-disable-next-line sonarjs/cognitive-complexity
export function buildServiceNameCascaderOptions(serviceNames: string[]) {
  // Sort the service names to ensure consistent ordering
  const sortedServiceNames = [...serviceNames].sort();

  // Keep track of the root elements
  const rootElements: CascaderOption[] = [];

  // Create a map to store the hierarchy
  const hierarchy = new Map<string, CascaderOption>();

  for (const serviceId of sortedServiceNames) {
    const parts = serviceId.split('/');
    let currentPath = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const previousPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      const isComplete = i === parts.length - 1;

      if (!hierarchy.has(currentPath) || isComplete) {
        const option: CascaderOption = {
          // the value needs to be different for a complete one vs the one that goes deeper otherwise it will not be selected.
          value: isComplete ? currentPath : currentPath + '/',
          label: part,
          items: isComplete ? undefined : [],
        };

        // if the option is not complete it should be part of the hierachy
        if (!isComplete) {
          hierarchy.set(currentPath, option);
        }

        // Add to parent's items if not root level, other wise it will be added to the rootElements
        if (previousPath) {
          const parent = hierarchy.get(previousPath);
          if (parent && parent.items) {
            parent.items.push(option);
          }
        } else {
          rootElements.push(option);
        }
      }
    }
  }
  return rootElements;
}
