import { AppPlugin } from '@grafana/data';
import { AppPluginSettings } from '@shared/types/AppPluginSettings';

import { App } from './app/App';
import { EXPLORE_TOOLBAR_ACTION, PluginExtensionExploreContext } from './links';

export const plugin = new AppPlugin<AppPluginSettings>()
  .addLink<PluginExtensionExploreContext>(EXPLORE_TOOLBAR_ACTION)
  .setRootPage(App);
