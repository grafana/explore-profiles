import { useEffect } from 'react';

import plugin from '../../../../plugin.json';

const NAVIGATION_ROUTES = plugin.includes.map(({ path }) => path.replace('%PLUGIN_ID%', plugin.id));

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

      return link as HTMLAnchorElement;
    });

function interceptClick(event: Event) {
  const link = event.currentTarget as HTMLAnchorElement;
  if (!link) {
    return;
  }

  const newSearch = new URLSearchParams(window.location.search).toString();
  const newHref = `${link.getAttribute('data-original-href')}?${newSearch}`;

  link.setAttribute('href', newHref);
}

export function useNavigationLinksUpdate() {
  useEffect(() => {
    const menuLinks = findMenuLinks();

    menuLinks.forEach((link) => {
      link.addEventListener('click', interceptClick, true);
    });

    return () => {
      menuLinks.forEach((link) => {
        link.removeEventListener('click', interceptClick, true);
      });
    };
  }, []);
}
