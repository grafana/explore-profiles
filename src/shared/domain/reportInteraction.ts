import { config, reportInteraction as grafanaReportInteraction } from '@grafana/runtime';

import { PYROSCOPE_APP_ID, ROUTES } from '../../constants';
import { LayoutType } from '../../pages/ProfilesExplorerView/components/SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { PanelType } from '../../pages/ProfilesExplorerView/components/SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';

const PROFILES_EXPLORER_PAGE_NAME = ROUTES.PROFILES_EXPLORER_VIEW.slice(1);

function getCurrentPage(): string {
  const { pathname } = new URL(window.location.toString());
  return pathname.split('/').pop() || '';
}

function getExtraProperties() {
  const page = getCurrentPage();
  const version = config.apps[PYROSCOPE_APP_ID].version;
  const extraProperties: Record<string, any> = { page, version };

  if (page === PROFILES_EXPLORER_PAGE_NAME) {
    extraProperties.explorationType = new URLSearchParams(window.location.search).get('explorationType');
  }

  return extraProperties;
}

// hey future dev: don't forget to add any new value to our features tracking dashboard!
export type InteractionName =
  | 'g_pyroscope_app_compare_link_clicked'
  | 'g_pyroscope_app_explain_flamegraph_clicked'
  | 'g_pyroscope_app_exploration_type_clicked'
  | 'g_pyroscope_app_export_profile'
  | 'g_pyroscope_app_fav_action_clicked'
  | 'g_pyroscope_app_function_details_clicked'
  | 'g_pyroscope_app_group_by_label_clicked'
  | 'g_pyroscope_app_hide_no_data_changed'
  | 'g_pyroscope_app_layout_changed'
  | 'g_pyroscope_app_optimize_code_clicked'
  | 'g_pyroscope_app_panel_type_changed'
  | 'g_pyroscope_app_profile_metric_selected'
  | 'g_pyroscope_app_quick_filter_focused'
  | 'g_pyroscope_app_select_action_clicked'
  | 'g_pyroscope_app_service_name_selected'
  | 'g_pyroscope_app_share_link_clicked'
  | 'g_pyroscope_app_user_settings_clicked';

type InteractionProperties =
  // g_pyroscope_app_exploration_type_clicked
  | { explorationType: string }
  // g_pyroscope_app_export_profile
  | { format: 'png' | 'json' | 'flamegraph.com' }
  // g_pyroscope_app_fav_action_clicked
  | { favAfterClick: boolean }
  // g_pyroscope_app_group_by_label_clicked
  | { label: string }
  // g_pyroscope_app_hide_no_data_changed
  | { hideNoData: 'on' | 'off' }
  // g_pyroscope_app_layout_changed
  | { layout: LayoutType }
  // g_pyroscope_app_panel_type_changed
  | { panelType: PanelType }
  // g_pyroscope_app_select_action_clicked
  | { type: string };

export function reportInteraction(interactionName: InteractionName, properties?: InteractionProperties) {
  grafanaReportInteraction(interactionName, {
    ...properties,
    ...getExtraProperties(),
  });
}
