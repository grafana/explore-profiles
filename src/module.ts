import { AppPlugin, AppPluginMeta } from '@grafana/data';
import { App } from './components/App';
import { AppConfig, AppPluginSettings } from './components/AppConfig';
import { PAGES } from 'grafana-pyroscope/public/app/pages/urls';

export const plugin = new AppPlugin<AppPluginSettings>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: AppConfig,
  id: 'configuration',
});

type PageType = keyof typeof PAGES;

// Note that this code will be executed once the first time the plugin has been active on screen.
// The purpose of this code is to override any pyroscope definitions and change them to plugin app equivalents.

const PLUGIN_PREFIX = `/a/grafana-pyroscope-app`;
// Change URL names where they don't match pyroscope
PAGES.CONTINOUS_SINGLE_VIEW = '/single'; // It isn't the default `/` in this app as it is in pyroscope.

// Update the URLs on PAGES to use the PLUGIN_PREFIX
for (const key in PAGES) {
  const page = key as PageType;
  PAGES[page] = `${PLUGIN_PREFIX}${PAGES[page]}`;
}
