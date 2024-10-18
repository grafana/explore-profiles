import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useChromeHeaderHeight } from '@grafana/runtime';
import { IconButton, InlineLabel, useStyles2 } from '@grafana/ui';
import { PluginInfo } from '@shared/ui/PluginInfo';
import React from 'react';

import { GiveFeedbackButton } from '../../GiveFeedbackButton';
import { SceneProfilesExplorer } from '../SceneProfilesExplorer';
import { useHeader } from './domain/useHeader';
import { ExplorationTypeSelector } from './ui/ExplorationTypeSelector';

type HeaderProps = {
  model: SceneProfilesExplorer;
};

export function Header({ model }: HeaderProps) {
  const chromeHeaderHeight = useChromeHeaderHeight();
  const styles = useStyles2(getStyles, chromeHeaderHeight ?? 0);

  const { data, actions } = useHeader(model);

  const { explorationType, dataSourceVariable, timePickerControl, refreshPickerControl, sceneVariables, gridControls } =
    data;

  return (
    <div className={styles.header} data-testid="allControls">
      <GiveFeedbackButton />

      <div className={styles.controls} data-testid="appControls">
        <div className={styles.headerLeft}>
          <div className={styles.dataSourceVariable}>
            <InlineLabel width="auto">{dataSourceVariable.state.label}</InlineLabel>
            <dataSourceVariable.Component model={dataSourceVariable} />
          </div>

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
        {sceneVariables.map((variable) => (
          <div key={variable.state.name} className={styles.variable} data-testid={variable.state.name}>
            {variable.state.label && <InlineLabel width="auto">{variable.state.label}</InlineLabel>}
            <variable.Component model={variable} />
          </div>
        ))}

        {gridControls.map((control) => (
          <control.Component key={control.state.key} model={control} />
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
  dataSourceVariable: css`
    display: flex;
    ${theme.breakpoints.down('xxl')} {
      label {
        display: none;
      }
    }
  `,
  variable: css`
    display: flex;
  `,
  sceneControls: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    padding: 0 0 ${theme.spacing(1)} 0;

    &#scene-controls-labels > div:last-child,
    &#scene-controls-flame-graph > div:last-child {
      flex-grow: 1;
    }
  `,
});
