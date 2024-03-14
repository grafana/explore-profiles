import { PLUGIN_BASE_URL } from '../../constants';

export function prefixRouteWithPluginBaseUrl(route: string): string {
  return `${PLUGIN_BASE_URL}/${route}`.replace(/\/{2,}/g, '/'); // Replace duplicate slashes, TODO: use new URL()?
}
