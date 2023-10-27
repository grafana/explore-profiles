import { AppPlugin } from '@grafana/data';
import { App } from './components/App';
import { AppConfig } from './components/AppConfig';
import { registerExtension } from './extensions/query-links';
import { AppPluginSettings } from './types/plugin';
import { PAGES } from 'grafana-pyroscope/public/app/pages/urls';
import { PLUGIN_BASE_URL } from './constants';

export const plugin = new AppPlugin<AppPluginSettings>().setRootPage(App).addConfigPage({
  title: 'Configuration',
  icon: 'cog',
  body: AppConfig,
  id: 'configuration',
});

// Note that this code will be executed immediately on the start of Grafana due to plugin.json `preload: true`
registerExtension(plugin);
updatePyroscopePageUrls();

function updatePyroscopePageUrls() {
  // Change URL names where they don't match pyroscope
  PAGES.CONTINOUS_SINGLE_VIEW = '/single'; // It isn't the default `/` in this app as it is in pyroscope.

  type PageType = keyof typeof PAGES;

  // The purpose of this code is to manually override any pyroscope definitions and change them to plugin app equivalents.
  // Wrapping the following in a function is only to ensure that this code is imported and called.
  // It only needs to be called once.

  // Update the URLs on PAGES to use the PLUGIN_PREFIX
  for (const key in PAGES) {
    const page = key as PageType;
    PAGES[page] = `${PLUGIN_BASE_URL}${PAGES[page]}`;
  }
}
