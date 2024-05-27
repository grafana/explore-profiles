import { History } from 'history';
import { useEffect } from 'react';
import { useHistory } from 'react-router-dom';

import plugin from '../../../../plugin.json';

const NAVIGATION_ROUTES = plugin.includes.map(({ path }) => path.replace('%PLUGIN_ID%', plugin.id));

const interceptClick = (history: History) => (event: Event) => {
  const link = (event.target as HTMLElement).closest('[aria-label="Navigation"] a') as HTMLAnchorElement;
  if (!link) {
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
    const onClick = interceptClick(history);

    document.body.addEventListener('click', onClick, true);

    return () => {
      document.body.removeEventListener('click', onClick, true);
    };
  }, [history]);
}
