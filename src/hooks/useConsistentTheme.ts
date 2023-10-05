import { useTheme2 } from '@grafana/ui';
import { useAppDispatch, useAppSelector } from 'grafana-pyroscope/public/app/redux/hooks';
import { selectAppColorMode, setColorMode } from 'grafana-pyroscope/public/app/redux/reducers/ui';
import { useEffect } from 'react';

export default function useConsistentTheme() {
  const dispatch = useAppDispatch();
  const colorMode = useAppSelector(selectAppColorMode);

  const { isLight } = useTheme2();

  useEffect(() => {
    const colorMode = isLight ? 'light' : 'dark';
    dispatch(setColorMode(colorMode));
  }, [colorMode, isLight, dispatch]);
}
