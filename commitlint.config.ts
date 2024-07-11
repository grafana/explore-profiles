import { RuleConfigSeverity } from '@commitlint/types';

export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [RuleConfigSeverity.Error, 'never', ['lower-case', 'camel-case', 'pascal-case']],
  },
};
