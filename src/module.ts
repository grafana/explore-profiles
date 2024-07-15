import { AppPlugin } from '@grafana/data';
import { AppPluginSettings } from '@shared/types/AppPluginSettings';

import { App } from './app/App';

export const plugin = new AppPlugin<AppPluginSettings>().setRootPage(App);
