import { config, reportInteraction as grafanaReportInteraction } from '@grafana/runtime';

import { PYROSCOPE_APP_ID, ROUTES } from '../../constants';
import { LayoutType } from '../../pages/ProfilesExplorerView/components/SceneByVariableRepeaterGrid/components/SceneLayoutSwitcher';
import { PanelType } from '../../pages/ProfilesExplorerView/components/SceneByVariableRepeaterGrid/components/ScenePanelTypeSwitcher';
import { GIT_COMMIT } from '../../version';

// hey future dev: don't forget to add any new value to our features tracking dashboard!
export type InteractionName =
  | 'g_pyroscope_app_compare_link_clicked'
  | 'g_pyroscope_app_diff_auto_select_clicked'
  | 'g_pyroscope_app_diff_choose_preset_clicked'
  | 'g_pyroscope_app_diff_learn_how_clicked'
  | 'g_pyroscope_app_diff_preset_save_clicked'
  | 'g_pyroscope_app_diff_preset_selected'
  | 'g_pyroscope_app_exclude_action_clicked'
  | 'g_pyroscope_app_explain_flamegraph_clicked'
  | 'g_pyroscope_app_exploration_type_clicked'
  | 'g_pyroscope_app_export_profile'
  | 'g_pyroscope_app_fav_action_clicked'
  | 'g_pyroscope_app_filters_changed'
  | 'g_pyroscope_app_function_details_clicked'
  | 'g_pyroscope_app_group_by_label_clicked'
  | 'g_pyroscope_app_hide_no_data_changed'
  | 'g_pyroscope_app_include_action_clicked'
  | 'g_pyroscope_app_layout_changed'
  | 'g_pyroscope_app_open_in_explore'
  | 'g_pyroscope_app_optimize_code_clicked'
  | 'g_pyroscope_app_panel_type_changed'
  | 'g_pyroscope_app_profile_metric_selected'
  | 'g_pyroscope_app_quick_filter_focused'
  | 'g_pyroscope_app_select_action_clicked'
  | 'g_pyroscope_app_service_name_selected'
  | 'g_pyroscope_app_share_link_clicked'
  | 'g_pyroscope_app_timeseries_scale_change'
  | 'g_pyroscope_app_user_settings_clicked';

type InteractionProperties =
  // g_pyroscope_app_diff_preset_changed
  | { value: string }
  // g_pyroscope_app_exploration_type_clicked
  | { explorationType: string }
  // g_pyroscope_app_export_profile
  | { format: 'png' | 'json' | 'pprof' | 'flamegraph.com' }
  // g_pyroscope_app_fav_action_clicked
  | { favAfterClick: boolean }
  // g_pyroscope_app_filters_changed
  | { name: string; count: number; operators: string[] }
  // g_pyroscope_app_hide_no_data_changed
  | { hideNoData: 'on' | 'off' }
  // g_pyroscope_app_layout_changed
  | { layout: LayoutType }
  // g_pyroscope_app_panel_type_changed
  | { panelType: PanelType }
  // g_pyroscope_app_select_action_clicked
  | { type: string }
  // g_pyroscope_app_timeseries_scale_change
  | { scale: string };

const PROFILES_EXPLORER_PAGE_NAME = ROUTES.PROFILES_EXPLORER_VIEW.slice(1);

function getCurrentPage(): string {
  const { pathname } = new URL(window.location.toString());
  return pathname.split('/').pop() || '';
}

function getMetaProperties() {
  const meta: Record<string, any> = {
    // same naming as Faro (see src/shared/infrastructure/tracking/faro/faro.ts)
    appRelease: config.apps[PYROSCOPE_APP_ID].version,
    appVersion: GIT_COMMIT,
    page: getCurrentPage(),
  };

  if (meta.page === PROFILES_EXPLORER_PAGE_NAME) {
    // same naming as Faro (see src/shared/infrastructure/tracking/faro/faro.ts)
    meta.view = new URLSearchParams(window.location.search).get('explorationType') || '';
  }

  return meta;
}

export function reportInteraction(interactionName: InteractionName, props?: InteractionProperties) {
  grafanaReportInteraction(interactionName, {
    props,
    meta: getMetaProperties(),
  });
}
