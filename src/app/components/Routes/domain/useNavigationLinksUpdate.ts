import { useEffect } from 'react';

import { PLUGIN_BASE_URL } from '../../../../constants';
import plugin from '../../../../plugin.json';

// Prefixes the route with the base URL of the plugin
export function prefixRoute(route: string): string {
  return `${PLUGIN_BASE_URL}/${route}`.replace(/\/{2,}/g, '/'); // Replace duplicate slashes
}

const NAVIGATION_ROUTES = plugin.includes
  .map(({ path }) => path.replace('%PLUGIN_ID%', plugin.id))
  // filter out pages that don't need URL search parameters update
  .filter((path) => !/(\/settings|\/ad-hoc)/.test(path));

const findMenuLinks = () =>
  Array.from(document.querySelectorAll(`a[href^="/a/${plugin.id}/"]`))
    .filter((link: Element) => {
      const href = link.getAttribute('data-original-href') || link.getAttribute('href');
      return href && NAVIGATION_ROUTES.includes(href);
    })
    .map((link: Element) => {
      if (!link.getAttribute('data-original-href') && link.getAttribute('href')) {
        link.setAttribute('data-original-href', link.getAttribute('href') as string);
      }

      return link;
    });

const onHistoryChange = () => {
  const newSearch = new URLSearchParams(window.location.search).toString();
  if (!newSearch) {
    return;
  }

  findMenuLinks().forEach((link: Element) => {
    const newHref = `${link.getAttribute('data-original-href')}?${newSearch}`;
    link.setAttribute('href', newHref);
  });
};

export function useNavigationLinksUpdate() {
  useEffect(() => {
    onHistoryChange();

    window.addEventListener('pushstate', onHistoryChange);
    window.addEventListener('popstate', onHistoryChange);

    return () => {
      findMenuLinks().forEach((link: Element) => {
        if (link.getAttribute('data-original-href')) {
          link.setAttribute('href', link.getAttribute('data-original-href') as string);
        }
      });

      window.removeEventListener('popstate', onHistoryChange);
      window.removeEventListener('pushstate', onHistoryChange);
    };
  }, []);
}
