import { ApiClient } from '@shared/infrastructure/http/ApiClient';
import {
  ListRecordingRulesResponse,
  RecordingRule,
  UpsertRecordingRuleRequest,
} from '@shared/pyroscope-api/settings/v1/recording_rules_pb';
import { RecordingRuleViewModel } from '@shared/types/RecordingRuleViewModel';

function mapRuleToRecordingRuleViewModel(rule: RecordingRule): RecordingRuleViewModel {
  let serviceName = '';
  for (let matcher of rule.matchers || []) {
    if (matcher.includes('service_name=')) {
      serviceName = matcher?.match(/service_name="([^"]+)"/)?.[1] || '';
      break;
    }
  }
  return {
    id: rule.id,
    metricName: rule.metricName,
    serviceName,
    profileType: rule.profileType,
    matchers: rule.matchers,
    groupBy: rule.groupBy || [],
  };
}

class RecordingRulesApiClient extends ApiClient {
  async get(): Promise<RecordingRuleViewModel[]> {
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
        return json.rules.map((rule: RecordingRule) => {
          return mapRuleToRecordingRuleViewModel(rule);
        });
      });
  }

  async create(rule: RecordingRuleViewModel): Promise<void> {
    return super
      .fetch('/settings.v1.RecordingRulesService/UpsertRecordingRule', {
        method: 'POST',
        body: JSON.stringify({
          metricName: rule.metricName,
          matchers: [
            `{ service_name="${rule.serviceName}" }`,
            `{ __profile_type__="${rule.profileType}"}`,
            ...(rule.matchers || []),
          ],
          groupBy: rule.groupBy || [],
        } as UpsertRecordingRuleRequest),
      })
      .then((response) => response.json());
  }

  async remove(rule: RecordingRuleViewModel): Promise<void> {
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
