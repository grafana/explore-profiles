import { useEffect } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';

import plugin from '../../../../plugin.json';

const NAVIGATION_ROUTES = plugin.includes.map(({ path }) => path.replace('%PLUGIN_ID%', plugin.id));

const interceptClick = (navigate: NavigateFunction) => (event: Event) => {
  const link = (event.target as HTMLElement).closest('[aria-label="Navigation"] a') as HTMLAnchorElement;
  if (!link) {
    return;
  }

  const pathname = link.getAttribute('href');

  if (!pathname || !NAVIGATION_ROUTES.includes(pathname)) {
    return;
  }

  navigate(
    {
      pathname,
      search: new URLSearchParams(window.location.search).toString(),
    },
    { replace: true }
  );

  event.preventDefault();
};

export function useNavigationLinksUpdate() {
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = interceptClick(navigate);

    document.body.addEventListener('click', onClick, true);

    return () => {
      document.body.removeEventListener('click', onClick, true);
    };
  }, [navigate]);
}
