import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { NavModel } from '@grafana/data';
import { usePluginProps } from './utils.plugin';
import { NAVIGATION, NAVIGATION_TITLE, NAVIGATION_SUBTITLE, PLUGIN_BASE_URL } from '../constants';
import plugin from '../plugin.json';

const ROUTES = plugin.includes.map((a) => a.path.replace('%PLUGIN_ID%', plugin.id));

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
          search: location.search,
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location.pathname,
    location.search,
    pluginProps?.basename,
    pluginProps?.meta.info.logos.large,
    pluginProps?.onNavChanged,
  ]);
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

export function getNavModel({
  activeId,
  basePath,
  logoUrl,
  search,
}: {
  search: string;
  activeId: string;
  basePath: string;
  logoUrl: string;
}) {
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

/*
 * update navigation links with existing query parameters
 * so that current state is kept when changing routes
 */
export function useNavigationLinksUpdate() {
  const location = useLocation();

  function getOriginalHref(el: Element) {
    const originalHref = el.getAttribute('data-original-href');
    const href = el.getAttribute('href');

    // Already set up
    if (originalHref) {
      return originalHref;
    }

    // For some reason href is not set, there's nothing we can do
    if (!href) {
      return;
    }

    // Set up
    el.setAttribute('data-original-href', href);
    return href;
  }

  useEffect(() => {
    function findSidebarLinks() {
      // TODO: come up with better selectors
      const tablist = document.querySelectorAll('[role="tablist"]');
      if (!tablist.length) {
        return;
      }

      return (
        Array.from(document.querySelectorAll(`[role="tablist"] a[role="tab"][href^="/a/${plugin.id}"]`))
          // Only care about routes that are defined in plugin.json
          .filter((a) => {
            const href = getOriginalHref(a);
            if (!href) {
              return false;
            }

            return ROUTES.includes(href);
          })
      );
    }

    function setHrefAttribute(fn: (href: string) => string) {
      return function (el: Element) {
        const href = getOriginalHref(el);
        if (!href) {
          return;
        }

        el.setAttribute('href', fn(href));
      };
    }

    const sidebarLinks = findSidebarLinks();
    sidebarLinks?.forEach(setHrefAttribute((href) => concatQueryParams(href, location.search)));

    return () => {
      sidebarLinks?.forEach(setHrefAttribute((href) => href));
    };
  }, [location.pathname, location.search]);
}

// TODO: this way of concatenating may not be the best
function concatQueryParams(basepath?: string, query?: string) {
  if (!basepath) {
    return '';
  }

  if (!query) {
    return basepath;
  }

  return `${basepath}${query}`;
}
