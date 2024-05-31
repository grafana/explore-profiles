import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObject, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import React from 'react';

type TabDefinition = {
  id: string;
  label: string;
  content: SceneObject;
};

interface SceneTabsState extends SceneObjectState {
  activeTabId: string;
  tabs: TabDefinition[];
  onChangeTab?: (tabId: string) => void;
  body: SceneObject;
}

export class SceneTabs extends SceneObjectBase<SceneTabsState> {
  constructor({ activeTabId, tabs }: { activeTabId: SceneTabsState['activeTabId']; tabs: SceneTabsState['tabs'] }) {
    super({
      key: 'tabs',
      activeTabId,
      tabs,
      body: SceneTabs.findTab(activeTabId, tabs).content,
    });
  }

  static findTab(tabId: string, tabs: SceneTabsState['tabs']) {
    const tab = tabs.find((tab) => tab.id === tabId);

    if (!tab) {
      throw new Error(`Unknown tab id="${tabId}"!`);
    }

    return tab;
  }

  onChangeTab = (tabId: string) => {
    this.setState({
      activeTabId: tabId,
      body: SceneTabs.findTab(tabId, this.state.tabs).content,
    });
  };

  static Component = ({ model }: SceneComponentProps<SceneTabs>) => {
    const styles = useStyles2(getStyles);
    const { activeTabId, tabs, body } = model.useState();

    return (
      <>
        <TabsBar>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              label={tab.label}
              active={activeTabId === tab.id}
              onChangeTab={model.onChangeTab.bind(model, tab.id)}
            />
          ))}
        </TabsBar>
        <TabContent className={styles.tabContent}>
          <body.Component model={body} />
        </TabContent>
      </>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  tabContent: css`
    padding: ${theme.spacing(2)};
    ${theme.spacing(1)} 0 ${theme.spacing(1)};
    background: transparent;
  `,
});
