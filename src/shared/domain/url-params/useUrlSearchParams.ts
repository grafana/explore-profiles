import { useHistory } from 'react-router-dom';

export function useUrlSearchParams() {
  const history = useHistory();

  return {
    // we don't use useLocation() for performance reasons: it would take too long to update after calling history.push()
    // and multiple history.push() would occur instead of a single one (e.g. happens when no params are present in the URL)
    searchParams: new URLSearchParams(window.location.search),
    pushNewUrl: (newParams: Record<string, string>) => {
      const newSearchParams = new URLSearchParams(window.location.search);

      for (const [key, value] of Object.entries(newParams)) {
        newSearchParams.set(key, value);
      }

      history.push({ search: newSearchParams.toString() });
    },
  };
}
