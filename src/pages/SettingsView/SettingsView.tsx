import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, Space, Tab, TabsBar, useStyles2 } from '@grafana/ui';
import { BackButton } from '@shared/components/Common/BackButton';
import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import { PageTitle } from '@shared/ui/PageTitle';
import React from 'react';

import { UISettingsView } from './components/UISettingsView/UISettingsView';
import { useSettingsView } from './domain/useSettingsView';

export default function SettingsView() {
  const styles = useStyles2(getStyles);
  const { data, actions } = useSettingsView();

  if (data.isLoading) {
    return <div>Loading...</div>;
  }

  const newTabBar = (index: number) => {
    const TabBar = ({ title }: { title: string }) => {
      return (
        <Tab
          key={`settings-tab-${index}`}
          label={title}
          active={data.activeTab === index}
          onChangeTab={() => actions.setActiveTab(index)}
        />
      );
    };
    TabBar.displayName = `TabBar-${index}`;
    return TabBar;
  };

  // Define the build in tabs
  const builtInTabs = [
    {
      // Standard UI settings tab
      title: newTabBar(0)({ title: 'UI Settings' }),
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
  const pluginTabs = data.components.map((Component, index) => {
    return {
      title: <Component {...pluginProps} TabBar={newTabBar(index + 1)} />,
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
          <TabsBar>{allTabs.map((tab) => tab.title)}</TabsBar>
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
