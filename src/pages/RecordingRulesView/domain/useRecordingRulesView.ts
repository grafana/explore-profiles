import { displayError, displaySuccess } from '@shared/domain/displayStatus';
import { RecordingRule } from '@shared/infrastructure/recording-rules/RecordingRule';
import { useFetchRecordingRules } from '@shared/infrastructure/recording-rules/useFetchRecordingRules';

export function useRecordingRulesView() {
  const { recordingRules, error: fetchError, remove, isFetching } = useFetchRecordingRules();

  return {
    data: {
      recordingRules,
      fetchError,
      isFetching,
    },
    actions: {
      async removeRecordingRule(rule: RecordingRule) {
        try {
          await remove(rule);
          displaySuccess([`Recording rule ${rule.name} deleted!`]);
        } catch (e) {
          displayError(e as Error, [`Failed to delete recording rule ${rule.name}.`]);
        }
      },
    },
  };
}
