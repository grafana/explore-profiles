import { css, cx } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React, { useEffect, useRef } from 'react';

type SingleEditionInputProps = {
  placeholder: string;
  onChange: (suggestion: SelectableValue<string>) => void;
  ref?: React.Ref<HTMLInputElement>;
  defaultValue?: string;
  onFocus?: () => void;
};

export function SingleEditionInput({ placeholder, defaultValue, onFocus, onChange }: SingleEditionInputProps) {
  const styles = useStyles2(getStyles);
  const inputRef = useRef<HTMLInputElement>(null);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.code === 'Enter') {
      const value = (e.target as HTMLInputElement).value.trim();
      onChange({ value, label: value });
    }
  };

  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = (e.target as HTMLInputElement).value.trim();
    onChange({ value, label: value });
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  });

  // we have to implement a customized version of the input because the <Input /> from the Sage Design system does not
  // allow any `ref` prop to be passed
  return (
    <div className={cx(styles.wrapper, defaultValue && styles.wrapperForEdition)}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder={placeholder}
          defaultValue={defaultValue}
          onFocus={onFocus}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
        />
      </div>
    </div>
  );
}

export const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    display: flex;
    width: 100%;
    height: ${theme.spacing(theme.components.height.md)};
    border-radius: ${theme.shape.radius.default};

    position: relative;
    left: -4px;
    border-left: 0;
  `,
  wrapperForEdition: css`
    position: absolute;
    left: 0;
  `,
  inputWrapper: css`
    position: relative;
    flex-grow: 1;
    z-index: 1;
  `,
  input: css`
    position: relative;
    z-index: 0;
    flex-grow: 1;
    width: 100%;
    height: 100%;
    line-height: ${theme.typography.body.lineHeight};
    border: 1px solid ${theme.components.input.borderColor};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(0, 1, 0, 1)};

    &:hover {
      border-color: ${theme.components.input.borderHover};
    }

    &:focus {
      outline: 2px dotted transparent;
      outline-offset: 2px;
      box-shadow: 0 0 0 2px ${theme.colors.background.canvas}, 0 0 0px 4px ${theme.colors.primary.main};
      transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
      transition-duration: 0.2s;
      transition-property: outline, outline-offset, box-shadow;
    }

    &::placeholder {
      color: ${theme.colors.text.disabled};
      opacity: 1;
    }
  `,
});
