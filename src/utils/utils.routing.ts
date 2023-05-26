import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NavModel } from '@grafana/data';
import { usePluginProps } from './utils.plugin';
import { NAVIGATION, NAVIGATION_TITLE, NAVIGATION_SUBTITLE, PLUGIN_BASE_URL } from '../constants';

// Displays a top navigation tab-bar if needed
export function useNavigation() {
  const pluginProps = usePluginProps();
  const location = useLocation();

  useEffect(() => {
    if (!pluginProps) {
      console.error('Root plugin props are not available in the context.');
      return;
    }

    const activeId = Object.keys(NAVIGATION).find((routeId) => routeId === unprefixRoute(location.pathname)) || '';
    const activeNavItem = NAVIGATION[activeId];
    const { onNavChanged, meta, basename } = pluginProps;

    // Disable tab navigation
    // (the route is not registered as a navigation item)
    if (!activeNavItem) {
      onNavChanged(undefined as unknown as NavModel);
    }

    // Show tabbed navigation with the active tab
    else {
      onNavChanged(
        getNavModel({
          activeId,
          basePath: basename,
          logoUrl: meta.info.logos.large,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, pluginProps?.basename, pluginProps?.meta.info.logos.large, pluginProps?.onNavChanged]);
}

// Prefixes the route with the base URL of the plugin
export function prefixRoute(route: string): string {
  // Replace duplicate slashes
  return `${PLUGIN_BASE_URL}/${route}`.replace(/\/{2,}/g, '/');
}

/**
 * undo prefixRoute
 */
function unprefixRoute(route: string) {
  return route.replace(PLUGIN_BASE_URL, '');
}

export function getNavModel({ activeId, basePath, logoUrl }: { activeId: string; basePath: string; logoUrl: string }) {
  const main = {
    text: NAVIGATION_TITLE,
    subTitle: NAVIGATION_SUBTITLE,
    url: basePath,
    img: logoUrl,
    children: Object.values(NAVIGATION).map((navItem) => ({
      ...navItem,
      active: navItem.id === activeId,
    })),
  };

  return {
    main,
    node: main,
  };
}
