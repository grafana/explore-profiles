import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObject, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import React from 'react';

import { SceneBreakdownTab } from './SceneBreakdownTab';
import { SceneFlameGraphTab } from './SceneFlameGraphTab';

interface SceneServiceDetailsTabsState extends SceneObjectState {
  serviceName: string;
  activeTabId: string;
  body?: SceneObject;
}

export class SceneServiceDetailsTabs extends SceneObjectBase<SceneServiceDetailsTabsState> {
  constructor({ serviceName, activeTabId }: { serviceName: string; activeTabId: string }) {
    super({
      serviceName,
      activeTabId,
      body: undefined,
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
    const { serviceName } = this.state;

    switch (tabId) {
      case 'breakdown':
        this.setState({
          activeTabId: tabId,
          body: new SceneBreakdownTab({ serviceName }),
        });
        break;

      case 'flame-graph':
        this.setState({
          activeTabId: tabId,
          body: new SceneFlameGraphTab({ serviceName }),
        });
        break;

      default:
        throw new Error(`Unknown tab id="${tabId}"!`);
    }
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
          <Tab
            label="Flame graph"
            active={activeTabId === 'flame-graph'}
            onChangeTab={() => model.setActiveTab('flame-graph')}
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
