import { useUrlSearchParams } from './useUrlSearchParams';

export function useSpanSelectorFromUrl(): [string | undefined, (newSpanSelector: string) => void] {
  const { searchParams, pushNewUrl } = useUrlSearchParams();
  const spanSelector = searchParams.get('spanSelector') ?? '';

  const setSpanSelector = (newSpanSelector: string) => {
    pushNewUrl({ spanSelector: newSpanSelector });
  };

  return [spanSelector, setSpanSelector];
}
