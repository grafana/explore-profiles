import { css } from '@emotion/css';
import { createTheme, GrafanaTheme2, LoadingState } from '@grafana/data';
import { FlameGraph } from '@grafana/flamegraph';
import {
  PanelBuilders,
  SceneComponentProps,
  SceneObjectBase,
  SceneObjectState,
  VariableDependencyConfig,
  VizPanel,
} from '@grafana/scenes';
import { Spinner, useStyles2, useTheme2 } from '@grafana/ui';
import { InlineBanner } from '@shared/components/InlineBanner';
import { Panel } from '@shared/components/Panel';
import { displayWarning } from '@shared/domain/displayStatus';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import React, { useMemo } from 'react';

import { buildProfileQueryRunner } from '../data/buildProfileQueryRunner';
import { SceneServiceDetails } from '../SceneServiceDetails/SceneServiceDetails';
import { ProfileMetricVariable } from '../variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../variables/ServiceNameVariable';

interface SceneFlameGraphState extends SceneObjectState {
  title: string;
  body: VizPanel;
}

export class SceneFlameGraph extends SceneObjectBase<SceneFlameGraphState> {
  protected _variableDependency = new VariableDependencyConfig(this, {
    variableNames: ['serviceName', 'profileMetricId'],
    onReferencedVariableValueChanged: () => {
      this.setState({
        title: SceneServiceDetails.buildtimeSeriesPanelTitle(
          ServiceNameVariable.find(this).getValue() as string,
          ProfileMetricVariable.find(this).getValue() as string
        ),
      });
    },
  });

  constructor() {
    super({
      key: 'flame-graph',
      title: '',
      $data: buildProfileQueryRunner({}),
      body: PanelBuilders.flamegraph()
        .setData(buildProfileQueryRunner({}))
        .setHeaderActions(<button>Explain flame graph</button>)
        .build(),
    });
  }

  static Component = ({ model }: SceneComponentProps<SceneFlameGraph>) => {
    const styles = useStyles2(getStyles);
    const { $data, title } = model.useState();

    const $dataState = $data!.useState();
    const isFetchingProfile = $dataState.data?.state === LoadingState.Loading;
    const data = $dataState.data?.series[0];
    const shouldHideFlamegraph = $dataState.data?.state === LoadingState.Done && Number(data?.length) <= 1;

    const { error: fetchSettingsError, settings } = useFetchPluginSettings();
    if (fetchSettingsError) {
      displayWarning([
        'Error while retrieving the plugin settings!',
        'Some features might not work as expected (e.g. collapsed flame graphs). Please try to reload the page, sorry for the inconvenience.',
      ]);
    }

    const { isLight } = useTheme2();
    const getTheme = () => createTheme({ colors: { mode: isLight ? 'light' : 'dark' } });

    const panelTitle = useMemo(
      () => (
        <>
          {title}
          {isFetchingProfile && <Spinner inline className={styles.spinner} />}
        </>
      ),
      [isFetchingProfile, styles.spinner, title]
    );

    return (
      <Panel title={panelTitle} isLoading={isFetchingProfile}>
        {shouldHideFlamegraph ? (
          <InlineBanner
            severity="warning"
            title="No profile data available"
            message="Please verify that you've selected adequate parameters: time range, profile metric and filters."
          />
        ) : (
          <FlameGraph
            data={data as any}
            disableCollapsing={!settings?.collapsedFlamegraphs}
            getTheme={getTheme as any}
            // extraHeaderElements={}
            // getExtraContextMenuButtons={}
          />
        )}
      </Panel>
    );
  };
}

const getStyles = (theme: GrafanaTheme2) => ({
  spinner: css`
    margin-left: ${theme.spacing(1)};
  `,
});
