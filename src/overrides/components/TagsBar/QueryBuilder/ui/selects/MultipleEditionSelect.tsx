import { MultiSelect, useStyles2 } from '@grafana/ui';
import React, { useCallback, useMemo, useState } from 'react';
import { getStyles } from './SingleEditionSelect';
import { Suggestion, Suggestions } from '../../domain/types';
import { MESSAGES } from '../constants';
import { SelectableValue } from '@grafana/data';

export type MultipleEditionSelectProps = {
  actor: any;
  selection: Suggestion;
  suggestions: any;
  onChange: (suggestions: Array<SelectableValue<string>>) => void;
  onCloseMenu: () => void;
};

export function MultipleEditionSelect({ actor, selection, suggestions }: MultipleEditionSelectProps) {
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

  const onCloseMenu = () => {
    if (values.length) {
      actor.send({
        type: 'SELECT_SUGGESTION',
        data: { value: values.map((v) => v.value).join('|'), label: values.map((v) => v.label).join(', ') },
      });
    } else {
      actor.send({ type: 'DISCARD_SUGGESTIONS' });
    }
  };

  return (
    <MultiSelect
      className={styles.editionSelect}
      placeholder={suggestions.placeholder}
      loadingMessage={MESSAGES.LOADING}
      closeMenuOnSelect={false}
      // auto focus required when switching from another operator type
      autoFocus
      value={values}
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
