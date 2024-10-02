import { css } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { Select, useStyles2 } from '@grafana/ui';
import React, { useEffect, useState } from 'react';

import { MESSAGES } from '../constants';
import { SingleEditionInput } from '../inputs/SingleEditionInput';

export const getStyles = () => ({
  select: css`
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  `,
});

type SingleSelectProps = {
  suggestions: any;
  onFocus: () => void;
  onChange: (suggestion: SelectableValue<string>) => void;
  onKeyDown: (event: any) => void;
  onCloseMenu: () => void;
};

// we use this hack to force the select to open after (e.g.) editing an existing attribute
// in this case, regardless that the `isOpen` prop of the <Select /> component is true
// the dropdown does not appear on the UI
// it seems it's a bug from the <Select /> component itself
// TODO: report it!
function useEnsureIsOpenHack(isVisible: boolean) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isVisible && !isOpen) {
      setTimeout(() => setIsOpen(true), 0);
      return;
    }

    if (isVisible !== isOpen) {
      setIsOpen(isVisible);
    }
  }, [isOpen, isVisible]);

  return isOpen;
}

export function SingleSelect({ suggestions, onFocus, onChange, onKeyDown, onCloseMenu }: SingleSelectProps) {
  const styles = useStyles2(getStyles);
  const isOpen = useEnsureIsOpenHack(suggestions.isVisible);

  if (suggestions.allowCustomValue) {
    return (
      <SingleEditionInput
        placeholder={suggestions.placeholder}
        onFocus={onFocus}
        onChange={onChange}
        onBlur={onCloseMenu}
      />
    );
  }

  return (
    <Select
      className={styles.select}
      placeholder={suggestions.placeholder}
      loadingMessage={MESSAGES.LOADING}
      closeMenuOnSelect={false}
      value={null}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onChange={onChange}
      onCloseMenu={onCloseMenu}
      options={suggestions.items}
      isOpen={isOpen}
      isLoading={suggestions.isLoading}
      invalid={Boolean(suggestions.error)}
      noOptionsMessage={suggestions.noOptionsMessage}
    />
  );
}
