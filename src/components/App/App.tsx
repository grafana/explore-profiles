import { AppRootProps, PageLayoutType, PluginContextProvider } from '@grafana/data';
import store from '@pyroscope/redux/store';
import { setupReduxQuerySync } from '@pyroscope/redux/useReduxQuerySync';
import * as React from 'react';
import { Provider } from 'react-redux';
import { Onboarding } from '../../pages/Onboarding';
import '../../styles/styles.scss';
import '../../utils/faro';

import { PluginPage } from '@grafana/runtime';
import { TitleReplacement } from './TitleReplacement';

import { Routes } from './Routes';
import { useEffect, useRef } from 'react';

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

function addStyle(styleString: string) {
  const style = document.createElement('style');
  style.textContent = styleString;
  document.head.append(style);
}

export function App(props: AppRootProps) {
  const unsubscribeRef = useRef<unknown>(null);

  if (!unsubscribeRef.current) {
    // we have to register as soon as possible to prevent loading apps before having parsed the URL parameters
    // we do this here and not at the top-level module scope so we can enable the plugin to be preloaded without setting history listeners,
    // which could cause conflicts with other parts of the platform or plugins
    unsubscribeRef.current = setupReduxQuerySync();
  }

  useEffect(() => {
    addStyle(`
main nav a[aria-label="Tab Single View AI"]::after {
  content: "New";
  position: absolute;
  right: 12px;
  background-color: rgb(255, 136, 51);
  color: #fff;
  padding: 0px 4px;
  border-radius: 2px;
  font-size: 12px;
}
    `);

    return () => {
      if (typeof unsubscribeRef.current === 'function') {
        // leave no trace when navigating outside of the plugin pages (see https://github.com/grafana/pyroscope-app-plugin/issues/171)
        unsubscribeRef.current();
      }
    };
  }, []);

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
