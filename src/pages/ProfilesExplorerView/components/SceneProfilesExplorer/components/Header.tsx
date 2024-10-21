import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useChromeHeaderHeight } from '@grafana/runtime';
import { Field, Icon, IconButton, useStyles2 } from '@grafana/ui';
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
};

export function Header(props: HeaderProps) {
  const chromeHeaderHeight = useChromeHeaderHeight();
  const styles = useStyles2(getStyles, chromeHeaderHeight ?? 0);

  const { data, actions } = useHeader(props);

  const { explorationType, dataSourceVariable, timePickerControl, refreshPickerControl, sceneVariables, gridControls } =
    data;

  return (
    <div className={styles.header} data-testid="allControls">
      <GiveFeedbackButton />

      <div className={styles.controls} data-testid="appControls">
        <div className={styles.headerLeft}>
          <ExplorationTypeSelector
            options={SceneProfilesExplorer.EXPLORATION_TYPE_OPTIONS}
            value={explorationType as string}
            onChange={actions.onChangeExplorationType}
          />
        </div>

        <div className={styles.headerRight}>
          {timePickerControl && (
            <timePickerControl.Component key={timePickerControl.state.key} model={timePickerControl} />
          )}
          {refreshPickerControl && (
            <refreshPickerControl.Component key={refreshPickerControl.state.key} model={refreshPickerControl} />
          )}

          <div className={styles.miscButtons}>
            <IconButton name="cog" tooltip="View/edit user settings" onClick={actions.onClickUserSettings} />

            <IconButton
              name="share-alt"
              tooltip="Copy shareable link to the clipboard"
              onClick={actions.onClickShareLink}
            />

            <PluginInfo />
          </div>
        </div>
      </div>

      <div id={`scene-controls-${explorationType}`} className={styles.sceneControls} data-testid="sceneControls">
        <Field
          label={dataSourceVariable.state.label}
          className={cx(styles.variable, dataSourceVariable.state.name)}
          data-testid={dataSourceVariable.state.name}
        >
          <dataSourceVariable.Component model={dataSourceVariable} />
        </Field>

        {sceneVariables.map((variable) => (
          <Field
            key={variable.state.name}
            label={
              variable.state.label === 'Filters' ? (
                <div className={styles.variableLabel}>
                  <Icon name="filter" className={styles.icon} />
                  {variable.state.label}
                </div>
              ) : (
                variable.state.label
              )
            }
            className={cx(styles.variable, variable.state.name)}
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

const getStyles = (theme: GrafanaTheme2, chromeHeaderHeight: number) => ({
  header: css`
    background-color: ${theme.colors.background.canvas};
    position: sticky;
    top: ${chromeHeaderHeight}px;
    z-index: 1;
  `,
  controls: css`
    display: flex;
    padding: ${theme.spacing(1)} 0;
    justify-content: space-between;
    gap: ${theme.spacing(2)};
  `,
  headerLeft: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  headerRight: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  miscButtons: css`
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
    padding: 0 0 ${theme.spacing(1)} 0;
    margin-top: 12px;

    &#scene-controls-labels > div:last-child,
    &#scene-controls-flame-graph > div:last-child {
      flex-grow: 1;
    }
  `,
  variable: css`
    display: flex;
    margin-bottom: 0;

    & #dataSource {
      width: ${theme.spacing(32)};
    }
  `,
  variableLabel: css`
    font-size: 12px;
    font-weight: 500;
    line-height: 15px;
    height: 15px;
    margin-bottom: 4px;
    color: rgb(204, 204, 220);
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
