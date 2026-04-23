import { useAssistant } from '@grafana/assistant';
import { useFlagGrafanaAssistantInProfilesDrilldown } from '@shared/infrastructure/featureFlags/featureFlags';

export const useGrafanaAssistant = () => {
  const { isAvailable } = useAssistant();
  const grafanaAssistantInProfilesDrilldown = useFlagGrafanaAssistantInProfilesDrilldown();

  // Do not show AI button if the assistant integration is enabled to avoid having two AI buttons in the UI
  // For debugging purposes and comparing both you can use localStorage flag grafana-pyroscope-app.forceShowAiButton
  const hideAIButton =
    grafanaAssistantInProfilesDrilldown &&
    isAvailable &&
    !localStorage.getItem('grafana-pyroscope-app.forceShowAIButton');

  return { hideAIButton, isAvailable };
};
