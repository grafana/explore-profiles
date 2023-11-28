import { MultiSelect, useStyles2 } from '@grafana/ui';
import React, { useCallback, useState } from 'react';
import { getStyles } from './SingleSelect';
import { Suggestions } from '../../domain/types';
import { MESSAGES } from '../constants';
import { SelectableValue } from '@grafana/data';

export type MultipleSelectProps = {
  actor: any;
  suggestions: any;
  onFocus: () => void;
};

export function MultipleSelect({ actor, suggestions, onFocus }: MultipleSelectProps) {
  const styles = useStyles2(getStyles);
  const [values, setValues] = useState<Suggestions>([]);

  const onChange = useCallback((newValues: Array<SelectableValue<string>>) => {
    setValues(newValues.map(({ value = '', label = '' }) => ({ value, label })));
  }, []);

  const onKeyDown = useCallback(
    (event: any) => {
      if (event.code === 'Backspace' && !event.target.value && !values.length) {
        actor.send({ type: 'REMOVE_LAST_FILTER' });
      }
    },

    [actor, values]
  );

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
      className={styles.select}
      placeholder={suggestions.placeholder}
      loadingMessage={MESSAGES.LOADING}
      closeMenuOnSelect={false}
      // auto focus required when switching from another operator type
      autoFocus
      value={values}
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
