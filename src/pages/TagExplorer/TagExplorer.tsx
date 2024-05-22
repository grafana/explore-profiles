import { useTheme2 } from '@grafana/ui';
import PyroscopeTagExplorerView from '@pyroscope/pages/TagExplorerView';
import { PageTitle } from '@shared/ui/PageTitle';
import { useSelectFirstApp } from 'grafana-pyroscope/public/app/hooks/useAppNames';
import { useAppDispatch, useAppSelector } from 'grafana-pyroscope/public/app/redux/hooks';
import { selectAppColorMode, setColorMode } from 'grafana-pyroscope/public/app/redux/reducers/ui';
import React, { useEffect } from 'react';

import { PyroscopeStateWrapper } from './PyroscopeState/PyroscopeStateWrapper';

// Module augmentation so that typescript sees our 'custom' element
/* eslint-disable no-unused-vars */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'pyroscope-app': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

function useConsistentTheme() {
  const dispatch = useAppDispatch();
  const colorMode = useAppSelector(selectAppColorMode);

  const { isLight } = useTheme2();

  useEffect(() => {
    const colorMode = isLight ? 'light' : 'dark';
    dispatch(setColorMode(colorMode));
  }, [colorMode, isLight, dispatch]);
}

export function TagExplorerView({}) {
  useConsistentTheme();
  useSelectFirstApp();

  return (
    <pyroscope-app className="app">
      <PyroscopeStateWrapper>
        <PageTitle title="Tag explorer" />
        <PyroscopeTagExplorerView />
      </PyroscopeStateWrapper>
    </pyroscope-app>
  );
}
