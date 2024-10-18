import { reportInteraction } from '@grafana/runtime';
import { SceneObject, SceneVariable } from '@grafana/scenes';
import { displaySuccess } from '@shared/domain/displayStatus';
import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { PLUGIN_BASE_URL } from 'src/constants';

import { ProfilesDataSourceVariable } from '../../../../domain/variables/ProfilesDataSourceVariable';
import { ExplorationType, SceneProfilesExplorer } from '../../SceneProfilesExplorer';
import { builsShareableUrl } from './builsShareableUrl';

async function onClickShareLink() {
  reportInteraction('g_pyroscope_app_share_link_clicked');

  try {
    await navigator.clipboard.writeText(builsShareableUrl().toString());

    displaySuccess(['Link copied to clipboard!']);
  } catch (error) {
    console.error('Error while creating the shareable link!');
    console.error(error);
  }
}

export function useHeader(model: SceneProfilesExplorer) {
  const { explorationType, controls, body, $variables } = model.useState();

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

  const history = useHistory();

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
    },
    actions: {
      onChangeExplorationType: model.onChangeExplorationType,
      onClickShareLink,
      onClickUserSettings: useCallback(() => {
        reportInteraction('g_pyroscope_app_user_settings_clicked');
        history.push(`${PLUGIN_BASE_URL}/settings`);
      }, [history]),
    },
  };
}
