import { useHistory, useLocation } from 'react-router-dom';

export function useUrlSearchParams() {
  const history = useHistory();
  const location = useLocation();

  return {
    searchParams: new URLSearchParams(location.search),
    pushNewUrl: (newParams: Record<string, string>) => {
      const newSearchParams = new URLSearchParams(window.location.search);

      for (const [key, value] of Object.entries(newParams)) {
        newSearchParams.set(key, value);
      }

      history.replace({ search: newSearchParams.toString() });
    },
  };
}
