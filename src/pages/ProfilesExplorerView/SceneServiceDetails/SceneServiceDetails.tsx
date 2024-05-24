import { css } from '@emotion/css';
import { DashboardCursorSync, GrafanaTheme2 } from '@grafana/data';
import {
  behaviors,
  EmbeddedSceneState,
  PanelBuilders,
  SceneComponentProps,
  SceneFlexItem,
  SceneFlexLayout,
  SceneObjectBase,
  SceneVariableSet,
  VariableValueSelectors,
} from '@grafana/scenes';
import { Stack, useStyles2 } from '@grafana/ui';
import { getProfileMetric, ProfileMetricId } from '@shared/infrastructure/profile-metrics/getProfileMetric';
import React from 'react';

import { buildProfileQueryRunner } from '../data/buildProfileQueryRunner';
import { ProfileMetricVariable } from '../variables/ProfileMetricVariable';
import { ServiceNameVariable } from '../variables/ServiceNameVariable';

interface SceneServiceDetailsState extends EmbeddedSceneState {}

export class SceneServiceDetails extends SceneObjectBase<SceneServiceDetailsState> {
  constructor({
    serviceName,
    profileMetricId,
    color,
  }: {
    serviceName: string;
    profileMetricId: string;
    color: string;
  }) {
    const profileMetricVariable = new ProfileMetricVariable({ value: profileMetricId });
    const profileMetric = getProfileMetric((profileMetricId || profileMetricVariable.getValue()) as ProfileMetricId);
    const profileMetricLabel = `${profileMetric.type} (${profileMetric.group})`;

    super({
      key: 'service-details',
      $variables: new SceneVariableSet({
        variables: [new ServiceNameVariable({ value: serviceName }), profileMetricVariable],
      }),
      controls: [new VariableValueSelectors({})],
      body: new SceneFlexLayout({
        direction: 'column',
        children: [
          new SceneFlexItem({
            body: PanelBuilders.timeseries()
              .setTitle(`${serviceName} · ${profileMetricLabel}`)
              .setOption('legend', { showLegend: true })
              .setData(buildProfileQueryRunner({}))
              .setColor({ mode: 'fixed', fixedColor: color })
              .setCustomFieldConfig('fillOpacity', 9)
              // .setCustomFieldConfig('drawStyle', DrawStyle.Bars)
              // .setCustomFieldConfig('fillOpacity', 100)
              // .setCustomFieldConfig('lineWidth', 0)
              .build(),
            $behaviors: [
              new behaviors.CursorSync({
                key: 'metricCrosshairSync',
                sync: DashboardCursorSync.Crosshair,
              }),
            ],
          }),
          new SceneFlexItem({
            body: undefined,
          }),
        ],
      }),
    });

    this.addActivationHandler(() => {});
  }

  static Component({ model }: SceneComponentProps<SceneServiceDetails>) {
    const styles = useStyles2(getStyles); // eslint-disable-line react-hooks/rules-of-hooks
    const { body, controls } = model.useState();

    const [variablesControl] = controls || [];

    return (
      <div className={styles.container}>
        <div className={styles.controls}>
          <Stack justifyContent="space-between">
            <div className={styles.variables}>
              <variablesControl.Component key={variablesControl.state.key} model={variablesControl} />{' '}
            </div>
          </Stack>
        </div>

        <body.Component model={body} />
      </div>
    );
  }
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    width: 100%;
    margin-top: ${theme.spacing(1)};
  `,
  controls: css`
    margin-bottom: ${theme.spacing(2)};
  `,
  variables: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  quickFilter: css`
    width: 100%;
  `,
});
