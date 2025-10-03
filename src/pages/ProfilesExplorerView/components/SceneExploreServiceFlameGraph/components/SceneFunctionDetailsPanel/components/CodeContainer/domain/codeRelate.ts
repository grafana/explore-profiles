import { createAssistantContextItem, isAssistantAvailable, openAssistant } from '@grafana/assistant';
import { rangeUtil } from '@grafana/data';

let isAvailable = false;

// Subscribe to assistant availability
isAssistantAvailable().subscribe((available) => {
  isAvailable = available;
});

export function codeRelate(functionCode: string) {
  if (!isAvailable) {
    // eslint-disable-next-line no-console
    console.error('Sorry, Grafana Assistant is not available');
    return;
  }

  const params = new URLSearchParams(document.URL);
  const serviceName = params.get('var-serviceName');
  const profileMetricId = params.get('var-profileMetricId');
  const shortProfileId = profileMetricId?.split(':').slice(0, 2).join('/');

  const from = params.get('from');
  const to = params.get('to');

  const timeRange = !from || !to ? 'last 30 minutes' : rangeUtil.describeTimeRange({ from, to });

  const prompt = [
    `Through a Profiles Drilldown query of the \`${shortProfileId}\` profile `,
    `for \`{service_name="${serviceName}"}\` in the ${timeRange} time range, `,
    `I found the following source code:\n\n`,
    '```\n',
    functionCode,
    '\n```\n\n',
    'Can you find relevant observability data from those lines of code (traces, metrics, or logs)?',
  ].join('');

  const datasourceUid = params.get('var-dataSource')!;

  const datasourceContext = createAssistantContextItem('datasource', {
    datasourceUid,
  });

  openAssistant({
    prompt,
    origin: 'drilldown-profiles/coderelate',
    context: [datasourceContext],
  });
}
