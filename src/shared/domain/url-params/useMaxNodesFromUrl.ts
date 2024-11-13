import { displayWarning } from '@shared/domain/displayStatus';
import { DEFAULT_SETTINGS } from '@shared/infrastructure/settings/PluginSettings';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { logger } from '@shared/infrastructure/tracking/logger';

import { useUrlSearchParams } from './useUrlSearchParams';

function useSetDefaultMaxNodes(hasMaxNodes: boolean, setMaxNodes: (newMaxNodes: number) => void) {
  const { isFetching, error, settings } = useFetchPluginSettings({ enabled: !hasMaxNodes });

  if (hasMaxNodes || isFetching) {
    return;
  }

  if (error) {
    displayWarning([
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. flame graph max nodes). Please try to reload the page, sorry for the inconvenience.',
    ]);
    logger.error(error);

    setMaxNodes(DEFAULT_SETTINGS.maxNodes);

    return;
  }

  setMaxNodes(settings!.maxNodes);
}

export function useMaxNodesFromUrl(): [number | null, (newMaxNodes: number) => void] {
  const { searchParams, pushNewUrl } = useUrlSearchParams();
  const maxNodes = Number(searchParams.get('maxNodes') ?? '');

  const setMaxNodes = (newMaxNodes: number) => {
    pushNewUrl({ maxNodes: String(newMaxNodes) });
  };

  useSetDefaultMaxNodes(maxNodes > 0, setMaxNodes);

  return [maxNodes, setMaxNodes];
}
