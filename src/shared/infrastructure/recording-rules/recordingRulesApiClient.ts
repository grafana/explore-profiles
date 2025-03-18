import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import {
  ListRecordingRulesResponse,
  RecordingRule as RecordingRuleProto,
  UpsertRecordingRuleRequest,
} from '@shared/pyroscope-api/settings/v1/recording_rules_pb';

import { RecordingRule } from './RecordingRule';

function mapRuleToRecordingRule(rule: RecordingRuleProto): RecordingRule {
  let serviceName = '';
  for (let matcher of rule.matchers || []) {
    if (matcher.includes('service_name=')) {
      serviceName = matcher?.match(/service_name="([^"]+)"/)?.[1] || '';
      break;
    }
  }
  return {
    id: rule.id,
    name: rule.metricName,
    serviceName,
    profileType: rule.profileType,
    matchers: rule.matchers,
    labels: rule.groupBy || [],
  };
}

// TODO(bryan): refactor this to use generated protobuf types
class RecordingRulesApiClient extends ApiClient {
  async get(): Promise<RecordingRule[]> {
    return super
      .fetch('/settings.v1.RecordingRulesService/ListRecordingRules', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      .then((response) => response.json())
      .then((json: ListRecordingRulesResponse) => {
        if (!json.rules) {
          return [];
        }
        return json.rules.map((rule: RecordingRuleProto) => {
          return mapRuleToRecordingRule(rule);
        });
      });
  }

  async create(rule: RecordingRule): Promise<void> {
    return super
      .fetch('/settings.v1.RecordingRulesService/UpsertRecordingRule', {
        method: 'POST',
        body: JSON.stringify({
          metricName: rule.name,
          matchers: [
            `{ service_name="${rule.serviceName}" }`,
            `{ __profile_type__="${rule.profileType}"}`,
            ...(rule.matchers || []),
          ],
          groupBy: rule.labels || [],
        } as UpsertRecordingRuleRequest),
      })
      .then((response) => response.json());
  }

  async remove(rule: RecordingRule): Promise<void> {
    return super
      .fetch('/settings.v1.RecordingRulesService/DeleteRecordingRule', {
        method: 'POST',
        body: JSON.stringify({
          id: rule.id,
        }),
      })
      .then((response) => response.json());
  }
}

export const recordingRulesApiClient = new RecordingRulesApiClient();
