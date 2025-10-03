import { isAssistantAvailable, openAssistant } from '@grafana/assistant';

let isAvailable = false;

// Subscribe to assistant availability
isAssistantAvailable().subscribe((available) => {
  isAvailable = available;
});

export function codeRelate(prompt: string) {
  if (!isAvailable) {
    alert('Sorry, not available');
    return;
  }

  openAssistant({
    prompt,
    origin: 'drilldown-profiles/coderelate',
  });
}
