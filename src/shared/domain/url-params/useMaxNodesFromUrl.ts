import { displayWarning } from '@shared/domain/displayStatus';
import { parseUrlSearchParams } from '@shared/domain/url-params/parseUrlSearchParams';
import { pushNewUrl } from '@shared/domain/url-params/pushNewUrl';
import { DEFAULT_SETTINGS } from '@shared/infrastructure/settings/default-settings';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { useEffect, useState } from 'react';

const setMaxNodes = (newMaxNodes: number) => {
  const searchParams = parseUrlSearchParams();

  if (searchParams.get('maxNodes') !== String(newMaxNodes)) {
    searchParams.set('maxNodes', String(newMaxNodes));

    pushNewUrl(searchParams);
  }
};

function useSetDefaultMaxNodes(): number | null {
  const searchParams = parseUrlSearchParams();
  let maxNodes = null;

  if (searchParams.get('maxNodes')) {
    maxNodes = Number(searchParams.get('maxNodes'));
  }

  const hasMaxNodes = Boolean(maxNodes);

  const { isFetching, error, settings } = useFetchPluginSettings({ enabled: !hasMaxNodes });

  if (hasMaxNodes || isFetching) {
    return maxNodes;
  }

  if (error) {
    displayWarning([
      'Error while retrieving the plugin settings!',
      'Some features might not work as expected (e.g. flamegraph max nodes). Please try to reload the page, sorry for the inconvenience.',
    ]);
    console.error(error);

    setMaxNodes(DEFAULT_SETTINGS.maxNodes);

    return DEFAULT_SETTINGS.maxNodes;
  }

  maxNodes = settings!.maxNodes;

  setMaxNodes(maxNodes);

  return maxNodes;
}

export function useMaxNodesFromUrl(): [number | null, (newMaxNodes: number) => void] {
  const defaultMaxNodes = useSetDefaultMaxNodes();
  const [maxNodes, setInternalMaxNodes] = useState(defaultMaxNodes);

  useEffect(() => {
    const onHistoryChange = () => {
      const newMaxNodes = parseUrlSearchParams().get('maxNodes');

      if (newMaxNodes !== maxNodes) {
        setInternalMaxNodes(Number(newMaxNodes));
      }
    };

    window.addEventListener('pushstate', onHistoryChange);
    window.addEventListener('popstate', onHistoryChange);

    return () => {
      window.removeEventListener('popstate', onHistoryChange);
      window.removeEventListener('pushstate', onHistoryChange);
    };
  }, [maxNodes]);

  return [maxNodes, setMaxNodes];
}
