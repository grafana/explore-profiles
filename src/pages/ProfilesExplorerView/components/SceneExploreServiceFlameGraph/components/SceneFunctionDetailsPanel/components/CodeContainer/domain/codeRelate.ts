import { createAssistantContextItem, isAssistantAvailable, openAssistant } from '@grafana/assistant';
import { rangeUtil } from '@grafana/data';

import { FunctionDetails } from '../../../domain/types/FunctionDetails';

let isAvailable = false;

// Subscribe to assistant availability
isAssistantAvailable().subscribe((available) => {
  isAvailable = available;
});

// TODO improve how these params are obtained and passed through the flow
export function codeRelate(functionCode: string, functionDetails: FunctionDetails) {
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

  const functionCodeOffset = functionDetails.startLine;
  const functionCodePath = functionDetails.fileName;
  const functionCodeRepository = functionDetails.version?.repository;
  const functionCodeCommit = functionDetails.commit.sha;

  const prompt = [
    `Through a Profiles Drilldown query of the \`${shortProfileId}\` profile `,
    `for \`{service_name="${serviceName}"}\` in the ${timeRange} time range, `,
    `I found the following source code:\n\n`,
    '```\n',
    functionCode,
    '\n```\n\n',
    `The source code is from file \`${functionCodePath}\`, starting with line ${functionCodeOffset}, so make sure to offset line reference by that much. The repository URL is \`${functionCodeRepository}\` and we used git reference \`${functionCodeCommit}\`\n`,
    '\n',
    'Can you generate an itemized list of the observabililty signals (metrics, logs or traces) you found in the given source code?\n',
    'Ensure to include a summary of the signal (and show the signal type using an emoji), the line number, a code snippet, a PromQL/LogQL/TraceQL query and a link showing executing the query in Grafana Explore. Make sure to correctly urlencode the parameters in the link.\n',
    'Remember in order to query the span name in TraceQL you need {name="[span name]"}.\n\n',
    'In order to verify your findings, query the related data sources and order the list starting with the one with the most results you found.\n\n',
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
