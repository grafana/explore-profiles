import { css } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { Select, useStyles2 } from '@grafana/ui';
import React from 'react';

import { MESSAGES } from '../constants';

export const getStyles = () => ({
  select: css`
    flex: 1 0 240px;
    align-self: flex-start;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    margin: 7px 0 0 0;
  `,
});

type SingleSelectProps = {
  suggestions: any;
  onFocus: () => void;
  onChange: (suggestion: SelectableValue<string>) => void;
  onKeyDown: (event: any) => void;
  onCloseMenu: () => void;
};

export function SingleSelect({ suggestions, onFocus, onChange, onKeyDown, onCloseMenu }: SingleSelectProps) {
  const styles = useStyles2(getStyles);

  return (
    <Select
      className={styles.select}
      placeholder={suggestions.placeholder}
      loadingMessage={MESSAGES.LOADING}
      closeMenuOnSelect={false}
      allowCustomValue={suggestions.allowCustomValue}
      // when allowCustomValue toggles to true, the menu will close.
      // setting `autofocus` prevents it. it works in combination with `isOpen` below.
      autoFocus={suggestions.allowCustomValue}
      value={null}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onChange={onChange}
      onCloseMenu={onCloseMenu}
      options={suggestions.items}
      isOpen={suggestions.isVisible}
      isLoading={suggestions.isLoading}
      invalid={Boolean(suggestions.error)}
      noOptionsMessage={suggestions.error ? MESSAGES.ERROR_LOAD : MESSAGES.SUGGESTIONS_NONE}
    />
  );
}