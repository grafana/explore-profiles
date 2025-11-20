import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useChromeHeaderHeight, usePluginComponent } from '@grafana/runtime';
import { Dropdown, ErrorBoundary, Field, Icon, IconButton, Menu, useStyles2 } from '@grafana/ui';
import { featureToggles } from '@shared/infrastructure/settings/featureToggles';
import { useFetchPluginSettings } from '@shared/infrastructure/settings/useFetchPluginSettings';
import { PluginInfo } from '@shared/ui/PluginInfo';
import React from 'react';

import { GiveFeedbackButton } from '../../GiveFeedbackButton';
import { SceneProfilesExplorer, SceneProfilesExplorerState } from '../SceneProfilesExplorer';
import { useHeader } from './domain/useHeader';
import { ExplorationTypeSelector } from './ui/ExplorationTypeSelector';

export type HeaderProps = {
  explorationType: SceneProfilesExplorerState['explorationType'];
  controls: SceneProfilesExplorerState['controls'];
  body: SceneProfilesExplorerState['body'];
  $variables: SceneProfilesExplorerState['$variables'];
  onChangeExplorationType: (explorationType: string) => void;
  onCreateRecordingRule: () => void;
  isEmbedded?: boolean;
};

export function Header(props: HeaderProps) {
  const chromeHeaderHeight = useChromeHeaderHeight?.();
  const styles = useStyles2(getStyles, chromeHeaderHeight ?? 0, props.isEmbedded ?? false);

  const { data, actions } = useHeader(props);

  const { settings } = useFetchPluginSettings();

  const {
    explorationType,
    dataSourceVariable,
    timePickerControl,
    refreshPickerControl,
    sceneVariables,
    gridControls,
    serviceName,
  } = data;

  type InsightsLauncherProps = {
    dataSourceUid: string;
    serviceName?: string;
  };
  const { component: InsightsLauncher } = usePluginComponent<InsightsLauncherProps>(
    'grafana-o11yinsights-app/insights-launcher/v1'
  );

  const metricsFromProfilesMenu = (
    <Menu>
      <Menu.Item
        ariaLabel="View recording rules"
        label="View recording rules"
        onClick={actions.onClickRecordingRules}
      />
      <Menu.Item ariaLabel="Add recording rule" label="Add recording rule" onClick={props.onCreateRecordingRule} />
    </Menu>
  );

  return (
    <div className={styles.header} data-testid="allControls">
      {!props.isEmbedded && <GiveFeedbackButton />}

      <div className={styles.appControls} data-testid="appControls">
        <div className={styles.appControlsLeft}>
          <ExplorationTypeSelector
            options={SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS}
            value={explorationType as string}
            onChange={actions.onChangeExplorationType}
          />
        </div>

        <div className={styles.appControlsRight}>
          {InsightsLauncher && (
            <ErrorBoundary>
              {({ error }) =>
                error ? undefined : (
                  <InsightsLauncher dataSourceUid={dataSourceVariable.getValueText()} serviceName={serviceName} />
                )
              }
            </ErrorBoundary>
          )}

          {timePickerControl && (
            <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
          )}
          {refreshPickerControl && (
            <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
          )}

          {!props.isEmbedded && (
            <div className={styles.appMiscButtons}>
              {settings?.enableMetricsFromProfiles && featureToggles.metricsFromProfiles && (
                <>
                  <Dropdown overlay={metricsFromProfilesMenu}>
                    <IconButton name="gf-prometheus" tooltip="Recording rules" aria-label="Recording rules" />
                  </Dropdown>
                </>
              )}

              <IconButton name="upload" tooltip="Upload ad hoc profiles" onClick={actions.onClickAdHoc} />

              <IconButton name="cog" tooltip="View/edit tenant settings" onClick={actions.onClickUserSettings} />

              <IconButton
                name="share-alt"
                tooltip="Copy shareable link to the clipboard"
                onClick={actions.onClickShareLink}
              />

              <PluginInfo />
            </div>
          )}
        </div>
      </div>

      <div id={`scene-controls-${explorationType}`} className={styles.sceneControls} data-testid="sceneControls">
        {!props.isEmbedded && (
          <Field
            label={dataSourceVariable.state.label}
            className={cx(styles.sceneVariable, dataSourceVariable.state.name)}
            data-testid={dataSourceVariable.state.name}
          >
            <dataSourceVariable.Component model={dataSourceVariable} />
          </Field>
        )}

        {sceneVariables.map((variable) => (
          <Field
            key={variable.state.name}
            label={
              variable.state.label === 'Filters' ? (
                <div className={styles.sceneVariableLabel}>
                  <Icon name="filter" className={styles.icon} />
                  {variable.state.label}
                </div>
              ) : (
                variable.state.label
              )
            }
            className={cx(styles.sceneVariable, variable.state.name)}
            data-testid={variable.state.name}
          >
            <variable.Component model={variable} />
          </Field>
        ))}

        {gridControls.map((control) => (
          <Field key={control.state.key} id={control.state.key} className={styles.gridControl} label="">
            <control.Component model={control} />
          </Field>
        ))}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2, chromeHeaderHeight: number, isEmbedded: boolean) => ({
  header: css`
    background-color: ${isEmbedded ? theme.colors.background.primary : theme.colors.background.canvas};
    position: sticky;
    top: ${isEmbedded ? 0 : chromeHeaderHeight}px;
    z-index: 1;
    padding-bottom: ${theme.spacing(2)};
  `,
  appControls: css`
    display: flex;
    padding: ${theme.spacing(1)} 0;
    justify-content: space-between;
    gap: ${theme.spacing(2)};
    flex-flow: wrap;
  `,
  appControlsLeft: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  appControlsRight: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  appMiscButtons: css`
    display: flex;
    align-items: center;
    gap: 4px;
    border: 1px solid ${theme.colors.border.weak};
    background-color: ${theme.colors.background.secondary};
    height: 32px;
    padding: 0 ${theme.spacing(1)};

    & svg {
      width: 18px;
      height: 18px;
    }
  `,
  sceneControls: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    padding: 0;
    margin-top: 20px;
  `,
  sceneVariable: css`
    display: flex;
    margin-bottom: 0;

    & #dataSource {
      width: ${theme.spacing(32)};
    }

    &.filters {
      flex-grow: 1;
    }

    &.compare-presets {
      margin-left: auto;
      text-align: right;
    }
  `,
  sceneVariableLabel: css`
    font-size: 12px;
    font-weight: 500;
    line-height: 15px;
    height: 15px;
    margin-bottom: 4px;
    color: ${theme.colors.text.primary};
    max-width: 480px;
  `,
  icon: css`
    display: inline-block;
    margin-right: 4px;
  `,
  gridControl: css`
    margin-bottom: 0;

    &#quick-filter {
      flex: 1;
      min-width: 112px;
    }
  `,
});
