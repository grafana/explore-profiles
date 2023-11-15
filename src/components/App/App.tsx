import { AppRootProps, PageLayoutType, PluginContextProvider } from '@grafana/data';
import store from '@pyroscope/redux/store';
import { useReduxQuerySync } from '@pyroscope/redux/useReduxQuerySync';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Onboarding } from '../../pages/Onboarding';
import '../../styles/styles.scss';
import '../../utils/faro';

import { PluginPage } from '@grafana/runtime';
import { TitleReplacement } from './TitleReplacement';

import { Routes } from './Routes';

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
export function App(props: AppRootProps) {
  // Leave no trace. But more specifically, see https://github.com/grafana/pyroscope-app-plugin/issues/171
  useReduxQuerySync();

  const renderTitle = React.useCallback((title: string) => <TitleReplacement subtitle={title} />, []);

  return (
    <PluginContextProvider meta={props.meta}>
      <Provider store={store}>
        <Onboarding>
          <PluginPage layout={PageLayoutType.Standard} renderTitle={renderTitle}>
            <pyroscope-app className="app">
              <div className="pyroscope-app">
                <Routes />
              </div>
            </pyroscope-app>
          </PluginPage>
        </Onboarding>
      </Provider>
    </PluginContextProvider>
  );
}
