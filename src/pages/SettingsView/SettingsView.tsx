import { TransportProvider } from '@connectrpc/connect-query';
import { createConnectTransport } from '@connectrpc/connect-web';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { PageTitle } from '@shared/ui/PageTitle';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

import { CollectorSettingsView } from './CollectorSettingsView';
import { UISettingsView } from './UISettingsView';

const queryClient = new QueryClient();

export default function SettingsView() {
  const styles = useStyles2(getStyles);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  const finalTransport = createConnectTransport({
    baseUrl: ApiClient.getBaseUrl(),
  });

  return (
    <TransportProvider transport={finalTransport}>
      <QueryClientProvider client={queryClient}>
        <PageTitle title="Profiles settings (tenant)" />
        <TabsBar>
          <Tab label=" UI" active={activeTabIndex === 0} onChangeTab={() => setActiveTabIndex(0)} />
          <Tab label=" Collection Rules" active={activeTabIndex === 1} onChangeTab={() => setActiveTabIndex(1)} />
        </TabsBar>
        <TabContent className={styles.tabContent}>
          {activeTabIndex === 0 && <UISettingsView />}
          {activeTabIndex === 1 && <CollectorSettingsView />}
        </TabContent>
      </QueryClientProvider>
    </TransportProvider>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  tabContent: css`
    padding: ${theme.spacing(2)};
    margin: ${theme.spacing(2)};
  `,
});
