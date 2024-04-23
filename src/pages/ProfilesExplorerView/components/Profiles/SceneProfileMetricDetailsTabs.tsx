import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { SceneComponentProps, SceneObject, SceneObjectBase, SceneObjectState } from '@grafana/scenes';
import { Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import React from 'react';

import { SceneBreakdownTab } from './SceneBreakdownTab';
import { SceneFlameGraphTab } from './SceneFlameGraphTab';

interface SceneProfileMetricDetailsTabsState extends SceneObjectState {
  profileMetric: { label: string; value: string };
  activeTabId: string;
  body?: SceneObject;
}

export class SceneProfileMetricDetailsTabs extends SceneObjectBase<SceneProfileMetricDetailsTabsState> {
  constructor({
    profileMetric,
    activeTabId,
  }: {
    profileMetric: SceneProfileMetricDetailsTabsState['profileMetric'];
    activeTabId: SceneProfileMetricDetailsTabsState['activeTabId'];
  }) {
    super({
      profileMetric,
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
    const { profileMetric } = this.state;

    switch (tabId) {
      case 'breakdown':
        this.setState({
          activeTabId: tabId,
          body: new SceneBreakdownTab({ profileMetric }),
        });
        break;

      case 'flame-graph':
        this.setState({
          activeTabId: tabId,
          body: new SceneFlameGraphTab({ profileMetric }),
        });
        break;

      default:
        throw new Error(`Unknown tab id="${tabId}"!`);
    }
  }

  public static Component = ({ model }: SceneComponentProps<SceneProfileMetricDetailsTabs>) => {
    const styles = useStyles2(getStyles);
    const { activeTabId, body } = model.useState();

    return (
      <div>
        <TabsBar>
          <Tab
            label="Flame graph"
            active={activeTabId === 'flame-graph'}
            onChangeTab={() => model.setActiveTab('flame-graph')}
          />
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
