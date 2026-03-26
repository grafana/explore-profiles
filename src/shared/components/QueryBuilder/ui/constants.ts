import { t } from '@grafana/i18n';

export const getMessages = () => ({
  FILTER_ADD: t('query-builder.placeholder.filter-add', 'Filter by label values...'),
  SELECT_LABEL: t('query-builder.placeholder.select-label', 'Select a label...'),
  SELECT_OPERATOR: t('query-builder.placeholder.select-operator', 'Select an operator...'),
  SELECT_VALUE: t('query-builder.placeholder.select-value', 'Select a value...'),
  SELECT_VALUES: t('query-builder.placeholder.select-values', 'Select values...'),
  TYPE_VALUE: t('query-builder.placeholder.type-value', 'Type a regex...'),
  LOADING: t('query-builder.loading', 'Loading...'),
  ERROR_LOAD: t('query-builder.error-load', 'An unexpected error occurred while loading! Please try again.'),
  SUGGESTIONS_NONE: t('query-builder.suggestions-none', 'No suggestions available.'),
  SUGGESTIONS_DISABLED: t('query-builder.suggestions-disabled', 'Suggestions are disabled for this label.'),
});
