import { css, cx } from '@emotion/css';
import { SelectableValue } from '@grafana/data';
import { Input, useStyles2 } from '@grafana/ui';
import React, { useEffect, useRef, useState } from 'react';

type SingleEditionInputProps = {
  placeholder: string;
  onChange: (suggestion: SelectableValue<string>) => void;
  onBlur: () => void;
  defaultValue?: string;
  onFocus?: () => void;
};

export function SingleEditionInput({ placeholder, defaultValue, onFocus, onChange, onBlur }: SingleEditionInputProps) {
  const styles = useStyles2(getStyles);

  const inputRef = useRef<HTMLInputElement>(null);
  const [invalid, setInvalid] = useState(false);

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value.trim();

    // TODO: introduce an "is empty" value to handle this case (so that the filter will be synced in the URL)?
    // see https://github.com/grafana/profiles-drilldown/pull/205
    if (e.code === 'Enter') {
      if (value) {
        onChange({ value, label: value });
      } else {
        setInvalid(true);
      }
    }
  };

  const onInternalBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value.trim();

    // TODO: introduce an "is empty" value to handle this case (so that the filter will be synced in the URL)?
    // see https://github.com/grafana/explore-profiles/pull/205
    if (value) {
      onChange({ value, label: value });
    } else {
      onBlur();
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <Input
      ref={inputRef}
      className={cx(defaultValue && styles.edition)}
      invalid={invalid}
      placeholder={placeholder}
      defaultValue={defaultValue}
      onFocus={onFocus}
      onKeyUp={onKeyUp}
      onBlur={onInternalBlur}
    />
  );
}

const getStyles = () => ({
  edition: css`
    position: absolute;
    z-index: 1;
  `,
});
