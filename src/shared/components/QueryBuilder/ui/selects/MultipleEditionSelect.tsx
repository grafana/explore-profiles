import { css } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { MultiSelect, useStyles2 } from '@grafana/ui';
import { localeCompare } from '@shared/domain/localeCompare';
import React, { useCallback, useMemo, useState } from 'react';

import { Suggestion, Suggestions } from '../../domain/types';
import { MESSAGES } from '../constants';

type MultipleEditionSelectProps = {
  selection: Suggestion;
  suggestions: any;
  onCloseMenu: (values: Suggestions) => void;
};

const placeSelectedValuesFirst = (values: Suggestions) => (a: Suggestion, b: Suggestion) => {
  const aIsSelected = values.some((v) => v.value === a.value);
  const bIsSelected = values.some((v) => v.value === b.value);

  if (aIsSelected && bIsSelected) {
    return localeCompare(a.value, b.value);
  }

  if (bIsSelected) {
    return +1;
  }

  if (aIsSelected) {
    return -1;
  }

  return 0;
};

export function MultipleEditionSelect({ selection, suggestions, onCloseMenu }: MultipleEditionSelectProps) {
  const styles = useStyles2(getStyles);

  const defaultValue = useMemo(() => {
    const selectionValues = selection.value.split('|');
    const selectionLabels = selection.label.split(', ');
    return selectionValues.map((v, i) => ({ value: v, label: selectionLabels[i] }));
  }, [selection]);

  const [values, setValues] = useState<Suggestions>(defaultValue);

  // we don't sort when values change so that, for long lists, the user keeps the context they're in
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sortedOptions = useMemo(() => suggestions.items.sort(placeSelectedValuesFirst(values)), [suggestions.items]);

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
      backspaceRemovesValue
      // auto focus required when switching from another operator type
      autoFocus
      value={values}
      onChange={onChange}
      onCloseMenu={onInternalCloseMenu}
      options={sortedOptions}
      isOpen
      isLoading={suggestions.isLoading}
      invalid={Boolean(suggestions.error)}
      noOptionsMessage={suggestions.noOptionsMessage}
    />
  );
}

const getStyles = () => ({
  editionSelect: css`
    position: absolute;
    z-index: 1;

    [aria-label='Remove'] svg {
      display: none;
    }
  `,
});
