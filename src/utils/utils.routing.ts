import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PLUGIN_BASE_URL } from '../constants';
import plugin from '../plugin.json';

const ROUTES = plugin.includes.map((a) => a.path.replace('%PLUGIN_ID%', plugin.id));

// Prefixes the route with the base URL of the plugin
export function prefixRoute(route: string): string {
  // Replace duplicate slashes
  return `${PLUGIN_BASE_URL}/${route}`.replace(/\/{2,}/g, '/');
}

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

function setHrefAttribute(fn: (href: string) => string) {
  return function (el: Element) {
    const href = getOriginalHref(el);
    if (!href) {
      return;
    }

    el.setAttribute('href', fn(href));
  };
}

/*
 * update navigation links with existing query parameters
 * so that current state is kept when changing routes
 */
export function useNavigationLinksUpdate() {
  const location = useLocation();

  useEffect(() => {
    function findSidebarLinks() {
      // classic menu vs "mega menu"
      const links =
        document.querySelectorAll(`[role="tablist"] a[role="tab"][href^="/a/${plugin.id}"]`) ||
        document.querySelectorAll('[data-testid="data-testid Nav menu item"]');

      if (!links.length) {
        return;
      }

      return (
        Array.from(links)
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
