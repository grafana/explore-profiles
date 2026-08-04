import { EchoBackend, EchoEventType, InteractionEchoEvent, registerEchoBackend } from '@grafana/runtime';

import { getFaro } from './faro';

// interaction names owned by this plugin: the typed wrapper uses g_pyroscope_app_*,
// older saved-searches call sites use grafana_profiles_app_*
const PLUGIN_INTERACTION_PREFIXES = ['g_pyroscope_app_', 'grafana_profiles_app_'];

const isPluginInteraction = (interactionName: string) =>
  PLUGIN_INTERACTION_PREFIXES.some((prefix) => interactionName.startsWith(prefix));

// faro event attributes must be strings
const toEventAttributes = (properties: Record<string, unknown> = {}): Record<string, string> => {
  const attributes: Record<string, string> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (value === undefined || value === null) {
      continue;
    }
    attributes[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
  }

  return attributes;
};

// echo backend that mirrors this plugin's reportInteraction events into faro as events.
// EchoSrv fans every interaction out to registered backends, so we filter to our own names
class FaroInteractionEchoBackend implements EchoBackend<InteractionEchoEvent, {}> {
  options = {};
  supportedEvents = [EchoEventType.Interaction];

  addEvent = (event: InteractionEchoEvent) => {
    const { interactionName, properties } = event.payload;

    if (!isPluginInteraction(interactionName)) {
      return;
    }

    getFaro()?.api.pushEvent(interactionName, toEventAttributes(properties));
  };

  // faro batches and sends internally, nothing to flush here
  flush = () => {};
}

let registered = false;

export const registerFaroInteractionEchoBackend = () => {
  if (registered) {
    return;
  }
  registered = true;

  registerEchoBackend(new FaroInteractionEchoBackend());
};
