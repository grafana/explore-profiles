import { usePluginComponents } from '@grafana/runtime';

const SETTINGS_EXTENSION_POINT_ID = 'grafana-pyroscope-app/settings/v1';

export type SettingsExtensionProps = {
  TabBar?: React.ComponentType<{ title: string }>; // when given it should render a tab bar
  datasourceUid: string; // the datasource uid currently in use
  backButton: React.ReactNode; // the back button component
};

type UseSettingsExtensionsResult<Props = {}> = {
  components: Array<React.ComponentType<Props>>;
  isLoading: boolean;
};

export function useSettingsExtensions(): UseSettingsExtensionsResult<SettingsExtensionProps> {
  return usePluginComponents<SettingsExtensionProps>({
    extensionPointId: SETTINGS_EXTENSION_POINT_ID,
  });
}
