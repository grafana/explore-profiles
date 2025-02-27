import { AppPlugin } from '@grafana/data';
import { AppPluginSettings } from '@shared/types/AppPluginSettings';

import { App } from './app/App';
import { EXPLORE_TOOLBAR_ACTION, PluginExtensionExploreContext, TRACEVIEW_DETAILS_ACTION } from './links';

export const plugin = new AppPlugin<AppPluginSettings>()
  .addLink<PluginExtensionExploreContext>(EXPLORE_TOOLBAR_ACTION)
  .addLink<PluginExtensionExploreContext>(TRACEVIEW_DETAILS_ACTION)
  .setRootPage(App);
