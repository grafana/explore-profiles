import { History } from 'history';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import plugin from '../../../../plugin.json';

const NAVIGATION_ROUTES = plugin.includes.map(({ path }) => path.replace('%PLUGIN_ID%', plugin.id));

const interceptClick = (history: History) => (event: Event) => {
  const link = (event.target as HTMLElement).closest('a') as HTMLAnchorElement;
  if (!link) {
    console.warn('Navigation link not found! Pyroscope URL Search parameters will not be preserved.');
    return;
  }

  const pathname = link.getAttribute('href');

  if (!pathname || !NAVIGATION_ROUTES.includes(pathname)) {
    return;
  }

  history.replace({
    pathname,
    search: new URLSearchParams(window.location.search).toString(),
  });

  event.preventDefault();
};

export function useNavigationLinksUpdate() {
  const history = useHistory();

  useEffect(() => {
    const navMenu = document.querySelector('[aria-label="Navigation"]');

    if (!navMenu) {
      console.warn(
        'Navigation menu not found! Pyroscope URL Search parameters will not be preserved when clicking on menu links.'
      );
      return;
    }

    const onClick = interceptClick(history);

    navMenu.addEventListener('click', onClick, true);

    return () => {
      navMenu.removeEventListener('click', onClick, true);
    };
  }, [history]);
}
