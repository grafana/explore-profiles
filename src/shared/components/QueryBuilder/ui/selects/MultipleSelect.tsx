import { css } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { MultiSelect, useStyles2 } from '@grafana/ui';
import React, { useCallback, useState } from 'react';

import { Suggestions } from '../../domain/types';
import { MESSAGES } from '../constants';

type MultipleSelectProps = {
  suggestions: any;
  onFocus: () => void;
  onKeyDown: (event: any, values: Suggestions) => void;
  onCloseMenu: (values: Suggestions) => void;
};

export function MultipleSelect({ suggestions, onFocus, onKeyDown, onCloseMenu }: MultipleSelectProps) {
  const styles = useStyles2(getStyles);
  const [values, setValues] = useState<Suggestions>([]);

  const onChange = useCallback((newValues: Array<SelectableValue<string>>) => {
    setValues(newValues.map(({ value = '', label = '' }) => ({ value, label })));
  }, []);

  const onInternalKeyDown = useCallback(
    (event: any) => {
      onKeyDown(event, values);
    },
    [onKeyDown, values]
  );

  const onInternalCloseMenu = useCallback(() => {
    onCloseMenu(values);
  }, [onCloseMenu, values]);

  return (
    <MultiSelect
      className={styles.select}
      placeholder={suggestions.placeholder}
      loadingMessage={MESSAGES.LOADING}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      backspaceRemovesValue
      // auto focus required when switching from another operator type
      autoFocus
      value={values}
      onFocus={onFocus}
      onKeyDown={onInternalKeyDown}
      onChange={onChange}
      onCloseMenu={onInternalCloseMenu}
      options={suggestions.items}
      isOpen={suggestions.isVisible}
      isLoading={suggestions.isLoading}
      invalid={Boolean(suggestions.error)}
      noOptionsMessage={suggestions.noOptionsMessage}
    />
  );
}

const getStyles = () => ({
  select: css`
    [aria-label='Remove'] svg {
      display: none;
    }
  `,
});
