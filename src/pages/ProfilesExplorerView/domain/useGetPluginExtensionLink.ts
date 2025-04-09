import { PluginExtensionLink } from '@grafana/data';
import { usePluginLinks } from '@grafana/runtime';

export const INVESTIGATIONS_EXTENSTION_POINT_ID = 'grafana-pyroscope-app/investigation/v1';
export const INVESTIGATIONS_APP_ID = 'grafana-investigations-app';

type UseGetPluginLinkParams = {
  extensionPointId: string;
  context?: object | Record<string | symbol, unknown>;
  pluginId: string;
};

export function useGetPluginExtensionLink({
  extensionPointId,
  context,
  pluginId,
}: UseGetPluginLinkParams): PluginExtensionLink | undefined {
  const pluginLinks = usePluginLinks({ extensionPointId, context });

  const [link] = pluginLinks.links.filter((link) => link.pluginId === pluginId);

  return link;
}
