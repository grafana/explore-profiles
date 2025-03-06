import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { RecordingRule } from '@shared/infrastructure/recording-rules/RecordingRule';
import { useFetchRecordingRules } from '@shared/infrastructure/recording-rules/useFetchRecordingRules';

export function useCreateRecordingRuleModal() {
  const { recordingRules, error: fetchError, mutate } = useFetchRecordingRules();

  return {
    data: {
      recordingRules,
      fetchError,
    },
    actions: {
      async save(rule: RecordingRule) {
        try {
          await mutate(rule);
          displaySuccess([`Recording rule ${rule.name} created successfully!`]);
        } catch (e) {
          displayError(e as Error, [`Failed to save recording rule ${rule.name}.`]);
        }
      },
    },
  };
}
