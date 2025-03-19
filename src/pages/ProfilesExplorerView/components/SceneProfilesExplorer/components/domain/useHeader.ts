import { SceneObject, SceneVariable } from '@grafana/scenes';
import { displaySuccess } from '@shared/domain/displayStatus';
import { reportInteraction } from '@shared/domain/reportInteraction';
import { logger } from '@shared/infrastructure/tracking/logger';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PLUGIN_BASE_URL, ROUTES } from 'src/constants';
import { getSceneVariableValue } from 'src/pages/ProfilesExplorerView/helpers/getSceneVariableValue';

import { ProfilesDataSourceVariable } from '../../../../domain/variables/ProfilesDataSourceVariable';
import { ExplorationType } from '../../SceneProfilesExplorer';
import { HeaderProps } from '../Header';
import { builsShareableUrl } from './builsShareableUrl';

async function onClickShareLink() {
  reportInteraction('g_pyroscope_app_share_link_clicked');

  try {
    await navigator.clipboard.writeText(builsShareableUrl().toString());

    displaySuccess(['Link copied to clipboard!']);
  } catch (error) {
    logger.error(error as Error, { info: 'Error while creating the shareable link!' });
  }
}

export function useHeader({ explorationType, controls, body, $variables, onChangeExplorationType }: HeaderProps) {
  const [timePickerControl, refreshPickerControl] =
    explorationType === ExplorationType.DIFF_FLAME_GRAPH ? [] : (controls as [SceneObject, SceneObject]);

  const dataSourceVariable = $variables.state.variables[0] as ProfilesDataSourceVariable;

  const bodySceneObject = body?.state.primary as any;

  if (typeof bodySceneObject.getVariablesAndGridControls !== 'function') {
    throw new Error(
      `Error while rendering "${bodySceneObject.constructor.name}": the "getVariablesAndGridControls" method is missing! Please implement it.`
    );
  }

  const { variables: sceneVariables, gridControls } = bodySceneObject.getVariablesAndGridControls() as {
    variables: SceneVariable[];
    gridControls: SceneObject[];
  };

  const dataSourceUid = dataSourceVariable.useState().value as string;

  const navigate = useNavigate();

  const explorationTypeHasServiceName =
    explorationType !== ExplorationType.ALL_SERVICES && explorationType !== ExplorationType.FAVORITES;

  const serviceName = explorationTypeHasServiceName ? getSceneVariableValue($variables, 'serviceName') : undefined;

  return {
    data: {
      explorationType,
      dataSourceVariable,
      timePickerControl,
      refreshPickerControl,
      sceneVariables,
      gridControls,
      body,
      dataSourceUid,
      serviceName,
    },
    actions: {
      onChangeExplorationType,
      onClickShareLink,
      onClickRecordingRules: useCallback(() => {
        reportInteraction('g_pyroscope_app_open_recording_rules_view');

        navigate(`${PLUGIN_BASE_URL}${ROUTES.RECORDING_RULES}`, { state: { referrer: window.location.href } });
      }, [navigate]),
      onClickAdHoc: useCallback(() => {
        reportInteraction('g_pyroscope_app_upload_ad_hoc_clicked');

        navigate(`${PLUGIN_BASE_URL}${ROUTES.ADHOC}`, { state: { referrer: window.location.href } });
      }, [navigate]),
      onClickUserSettings: useCallback(() => {
        reportInteraction('g_pyroscope_app_user_settings_clicked');

        navigate(`${PLUGIN_BASE_URL}${ROUTES.SETTINGS}`, { state: { referrer: window.location.href } });
      }, [navigate]),
    },
  };
}
