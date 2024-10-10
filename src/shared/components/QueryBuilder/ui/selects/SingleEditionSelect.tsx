import { css } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { Select, useStyles2 } from '@grafana/ui';
import React from 'react';

import { Suggestion } from '../../domain/types';
import { MESSAGES } from '../constants';
import { SingleEditionInput } from '../inputs/SingleEditionInput';

const getStyles = () => ({
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

type EditionSelectProps = {
  selection: Suggestion;
  suggestions: any;
  onChange: (suggestion: SelectableValue<string>) => void;
  onCloseMenu: () => void;
};

export function SingleEditionSelect({ selection, suggestions, onChange, onCloseMenu }: EditionSelectProps) {
  const styles = useStyles2(getStyles);

  if (suggestions.allowCustomValue) {
    return (
      <SingleEditionInput
        defaultValue={selection.value}
        placeholder={suggestions.placeholder}
        onChange={onChange}
        onBlur={onCloseMenu}
      />
    );
  }

  return (
    <Select
      className={styles.editionSelect}
      placeholder={suggestions.placeholder}
      loadingMessage={MESSAGES.LOADING}
      closeMenuOnSelect={false}
      autoFocus
      value={selection.value}
      onChange={onChange}
      onCloseMenu={onCloseMenu}
      options={suggestions.items}
      isOpen
      isLoading={suggestions.isLoading}
      invalid={Boolean(suggestions.error)}
      noOptionsMessage={suggestions.noOptionsMessage}
    />
  );
}
