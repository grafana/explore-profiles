import { usePluginComponents } from '@grafana/runtime';

const SETTINGS_EXTENSION_POINT_ID = 'grafana-pyroscope-app/settings/v1';

export type SettingsExtensionProps = {
  datasourceUid: string; // the datasource uid currently in use, extensions might not use it
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
