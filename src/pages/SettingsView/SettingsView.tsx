import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Space, Tab, TabsBar, useStyles2 } from '@grafana/ui';
import { BackButton } from '@shared/components/Common/BackButton';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { useReportPageInitialized } from '@shared/infrastructure/tracking/useReportPageInitialized';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { UISettingsView } from './components/UISettingsView/UISettingsView';
import { useSettingsView } from './domain/useSettingsView';

interface ComponentWithMeta {
  meta?: {
    title: string;
  };
}

export default function SettingsView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useSettingsView();

  useReportPageInitialized('settings');

  if (data.isLoading) {
    return <div>Loading...</div>;
  }

  // Define the build in tabs
  const builtInTabs = [
    {
      // Standard UI settings tab
      title: 'UI Settings',
      content: (
        <UISettingsView>
          <div className={styles.buttons}>
            <Button variant="primary" type="submit">
              Save settings
            </Button>
            <BackButton onClick={actions.goBack} />
          </div>
        </UISettingsView>
      ),
    },
  ];

  const pyroscopeDataSource = ApiClient.selectDefaultDataSource();
  const pluginProps = {
    datasourceUid: pyroscopeDataSource.uid,
    backButton: (
      <div className={styles.buttons}>
        <BackButton onClick={actions.goBack} />
      </div>
    ),
  };
  const pluginTabs = data.components.map((Component) => {
    // get title from plugin meta (works in Grafana 11.6+)
    const title = (Component as ComponentWithMeta).meta?.title || 'Unknown Extension';

    return {
      title: title,
      content: <Component {...pluginProps} />,
    };
  });

  const allTabs = [...builtInTabs, ...pluginTabs];

  return (
    <>
      <PageTitle title="Profiles settings (tenant)" />
      {/* if there is only one tab, don't render tab bar */}
      {allTabs.length > 1 && (
        <>
          <TabsBar>
            {allTabs.map((tab, index) => (
              <Tab
                key={`settings-tab-${index}`}
                label={tab.title}
                active={data.activeTab === index}
                onChangeTab={() => actions.setActiveTab(index)}
              />
            ))}
          </TabsBar>
          <Space v={2} />
        </>
      )}
      {allTabs[data.activeTab].content}
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  buttons: css`
    display: flex;
    gap: ${theme.spacing(1)};
    margin-top: ${theme.spacing(3)};
  `,
});
