import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import {
  EmbeddedSceneState,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectUrlSyncConfig,
  SceneObjectUrlValues,
  SceneRefreshPicker,
  SceneTimePicker,
  SceneTimeRange,
  SceneVariableSet,
  SplitLayout,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Stack, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import React from 'react';

import { SceneExploreServices } from './SceneExploreServices';
import { ProfilesDataSourceVariable } from './variables/ProfilesDataSourceVariable';

interface SceneProfilesExplorerState extends EmbeddedSceneState {
  tab: string;
  body: SplitLayout;
}

export class SceneProfilesExplorer extends SceneObjectBase<SceneProfilesExplorerState> {
  protected _urlSync = new SceneObjectUrlSyncConfig(this, { keys: ['tab'] });

  constructor() {
    super({
      tab: 'explore-services',
      $timeRange: new SceneTimeRange({}),
      $variables: new SceneVariableSet({
        variables: [new ProfilesDataSourceVariable({})],
      }),
      controls: [
        new VariableValueSelectors({}),
        new SceneTimePicker({ isOnCanvas: true }),
        new SceneRefreshPicker({ isOnCanvas: true }),
      ],
      // TOOD: state var to update when switching tab
      body: new SplitLayout({
        direction: 'column',
        primary: new SceneExploreServices(),
      }),
    });
  }

  getUrlState() {
    return {
      tab: this.state.tab,
    };
  }

  updateFromUrl(values: SceneObjectUrlValues) {
    const stateUpdate: Partial<SceneProfilesExplorerState> = {};

    if (typeof values.tab === 'string' && values.tab !== this.state.tab) {
      stateUpdate.tab = values.tab;
    }

    this.setState(stateUpdate);
  }

  static Component({ model }: SceneComponentProps<SceneProfilesExplorer>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { controls, tab, body } = model.useState();

    const [variablesControl, timePickerControl, refreshPickerControl] = controls || [];

    return (
      <>
        <div className={styles.header}>
          <div className={styles.controls}>
            <Stack justifyContent="space-between">
              <div>
                <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />
              </div>
              <Stack>
                <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
                <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
              </Stack>
            </Stack>
          </div>
        </div>

        <TabsBar>
          <Tab
            label="Explore services"
            active={tab === 'explore-services'}
            onChangeTab={() => model.setState({ tab: 'explore-services' })}
          />
          <Tab
            label="Explore profile metrics"
            active={tab === 'explore-profile-metrics'}
            onChangeTab={() => model.setState({ tab: 'explore-profile-metrics' })}
          />
          <Tab
            label="Favorites"
            active={tab === 'favorites'}
            onChangeTab={() => model.setState({ tab: 'favorites' })}
          />
        </TabsBar>

        <TabContent className={styles.tabContent}>
          <body.Component model={body} />
        </TabContent>
      </>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  header: css`
    background-color: ${theme.colors.background.canvas};
    position: sticky;
    top: 0;
    z-index: 1;
    margin-bottom: ${theme.spacing(1)};
  `,
  controls: css`
    padding: 0 0 ${theme.spacing(2)};
  `,
  tabContent: css`
    position: relative;
    z-index: 0;
    margin-top: ${theme.spacing(1)};
    padding-top: ${theme.spacing(1)};
    background: transparent;
  `,
});
