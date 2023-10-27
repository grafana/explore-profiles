import { AppPlugin } from '@grafana/data';
import { AppPluginSettings } from '../../types/plugin';
import configure from './configure';

const ID = 'plugins/grafana-pyroscope-datasource/query-links';

export function registerExtension(plugin: AppPlugin<AppPluginSettings>) {
  plugin.configureExtensionLink({
    extensionPointId: ID,
    title: 'Profiles App',
    description: 'Open query in Profiles App',
    // This is to ensure that `configure` is called
    onClick: () => null,
    configure,
  });
}
