import { SelectableValue } from '@grafana/data';
import { MultiSelect, useStyles2 } from '@grafana/ui';
import React, { useCallback, useMemo, useState } from 'react';

import { Suggestion, Suggestions } from '../../domain/types';
import { MESSAGES } from '../constants';
import { getStyles } from './SingleEditionSelect';

export type MultipleEditionSelectProps = {
  selection: Suggestion;
  suggestions: any;
  onCloseMenu: (values: Suggestions) => void;
};

export function MultipleEditionSelect({ selection, suggestions, onCloseMenu }: MultipleEditionSelectProps) {
  const styles = useStyles2(getStyles);

  const defaultValue = useMemo(() => {
    const selectionValues = selection.value.split('|');
    const selectionLabels = selection.label.split(', ');
    return selectionValues.map((v, i) => ({ value: v, label: selectionLabels[i] }));
  }, [selection]);

  const [values, setValues] = useState<Suggestions>(defaultValue);

  const onChange = useCallback((newValues: Array<SelectableValue<string>>) => {
    setValues(newValues.map(({ value = '', label = '' }) => ({ value, label })));
  }, []);

  const onInternalCloseMenu = useCallback(() => {
    onCloseMenu(values);
  }, [onCloseMenu, values]);

  return (
    <MultiSelect
      className={styles.editionSelect}
      placeholder={suggestions.placeholder}
      loadingMessage={MESSAGES.LOADING}
      closeMenuOnSelect={false}
      hideSelectedOptions={false}
      // auto focus required when switching from another operator type
      autoFocus
      value={values}
      onChange={onChange}
      onCloseMenu={onInternalCloseMenu}
      options={suggestions.items}
      isOpen
      isLoading={suggestions.isLoading}
      invalid={Boolean(suggestions.error)}
      noOptionsMessage={suggestions.noOptionsMessage}
    />
  );
}
