import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Select, useStyles2 } from '@grafana/ui';
import React from 'react';

import { Suggestion } from '../../domain/types';
import { MESSAGES } from '../constants';

// TODO: use the Grafana theme
// eslint-disable-next-line no-unused-vars
export const getStyles = (theme: GrafanaTheme2) => ({
  editionSelect: css`
    position: absolute;
    z-index: 1;
    min-width: 160px;
    box-shadow: none;
    & input:focus {
      outline: none !important;
    }
  `,
});

export type EditionSelectProps = {
  selection: Suggestion;
  suggestions: any;
  onChange: (suggestion: SelectableValue<string>) => void;
  onCloseMenu: () => void;
};

export function SingleEditionSelect({ selection, suggestions, onChange, onCloseMenu }: EditionSelectProps) {
  const styles = useStyles2(getStyles);

  return (
    <Select
      className={styles.editionSelect}
      placeholder={suggestions.placeholder}
      loadingMessage={MESSAGES.LOADING}
      closeMenuOnSelect={false}
      allowCustomValue={suggestions.allowCustomValue}
      autoFocus
      value={suggestions.allowCustomValue ? undefined : selection.value}
      onChange={onChange}
      onCloseMenu={onCloseMenu}
      options={suggestions.items}
      isOpen
      isLoading={suggestions.isLoading}
      invalid={Boolean(suggestions.error)}
      noOptionsMessage={suggestions.error ? MESSAGES.ERROR_LOAD : MESSAGES.SUGGESTIONS_NONE}
    />
  );
}
