import { t } from '@grafana/i18n';

import { Suggestions } from '../domain/types';

class OperatorsRepository {
  async list(): Promise<Suggestions> {
    return [
      { value: '=', label: '=' },
      { value: '!=', label: '!=' },
      { value: 'is-empty', label: t('query-builder.operators.is-empty', 'is empty') },
      {
        value: 'in',
        label: t('query-builder.operators.in', 'in'),
        description: t('query-builder.operators.in-description', 'Is one of'),
      },
      {
        value: 'not-in',
        label: t('query-builder.operators.not-in', 'not in'),
        description: t('query-builder.operators.not-in-description', 'Is not one of'),
      },
      { value: '=~', label: '=~', description: t('query-builder.operators.regex-match-description', 'Matches regex') },
      {
        value: '!~',
        label: '!~',
        description: t('query-builder.operators.regex-not-match-description', 'Does not match regex'),
      },
    ];
  }
}

export const operatorsRepository = new OperatorsRepository();
