import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import React from 'react';

import { SceneBreakdownTab } from './SceneBreakdownTab';

interface SceneServiceDetailsTabsState extends SceneObjectState {
  serviceName: string;
  activeTabId: string;
  body?: SceneBreakdownTab;
}

export class SceneServiceDetailsTabs extends SceneObjectBase<SceneServiceDetailsTabsState> {
  constructor(state: SceneServiceDetailsTabsState) {
    const { serviceName } = state;

    super({
      ...state,
      body: new SceneBreakdownTab({ serviceName }),
    });

    this.onActivate = this.onActivate.bind(this);
    this.addActivationHandler(() => {
      this.onActivate();
    });
  }

  async onActivate() {
    this.setActiveTab(this.state.activeTabId);
  }

  setActiveTab(tabId: string) {
    this.setState({
      activeTabId: tabId,
    });
  }

  public static Component = ({ model }: SceneComponentProps<SceneServiceDetailsTabs>) => {
    const styles = useStyles2(getStyles);
    const { activeTabId, body } = model.useState();

    return (
      <div>
        <TabsBar>
          <Tab
            label="Breakdown"
            active={activeTabId === 'breakdown'}
            onChangeTab={() => model.setActiveTab('breakdown')}
          />
        </TabsBar>
        <TabContent className={styles.tabContent}>{body && <body.Component model={body} />}</TabContent>
      </div>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  tabContent: css`
    padding: ${theme.spacing(1)};
    margin: ${theme.spacing(1)};
    background: transparent;
  `,
});
