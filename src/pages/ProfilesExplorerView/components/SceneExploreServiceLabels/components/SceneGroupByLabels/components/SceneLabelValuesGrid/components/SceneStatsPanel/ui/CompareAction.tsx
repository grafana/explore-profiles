import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Tooltip, useStyles2 } from '@grafana/ui';
import React, { useEffect, useRef, useState } from 'react';

import { CompareTarget } from '../../../../../../../../SceneExploreDiffFlameGraph/domain/types';

type CompareActionProps = {
  option: {
    label: string;
    value: CompareTarget;
    description: string;
  };
  checked: boolean;
  onChange: (compareTarget: CompareTarget) => void;
};

export function CompareAction({ option, checked, onChange }: CompareActionProps) {
  const styles = useStyles2(getStyles);

  const [showTooltip, setShowTooltip] = useState(false);
  const checkboxRef = useRef<HTMLInputElement>(null);
  const label = (checkboxRef.current as HTMLInputElement)?.closest('label');

  // we write custom code to provide the tooltips because wrapping our checkbox into the <Tooltip> component does not work
  useEffect(() => {
    if (!label || checked) {
      setShowTooltip(false);
      return;
    }

    const onMouseEnter = () => {
      setShowTooltip(true);
    };

    const onMouseLeave = () => {
      setShowTooltip(false);
    };

    label.addEventListener('mouseenter', onMouseEnter);
    label.addEventListener('mouseleave', onMouseLeave);

    return () => {
      label.removeEventListener('mouseleave', onMouseLeave);
      label.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [checked, label]);

  return (
    <>
      <Tooltip content={option.description} show={!checked && showTooltip} placement="top">
        <span className={styles.tooltipAnchor} />
      </Tooltip>
      <Checkbox
        ref={checkboxRef}
        className={cx(styles.checkbox, 'checkbox', checked && 'checked')}
        checked={checked}
        label={option.label}
        onChange={() => onChange(option.value)}
      />
    </>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  tooltipAnchor: css`
    position: relative;
    left: 42px;
  `,
  checkbox: css`
    column-gap: 4px;

    &:last-child {
      & :nth-child(1) {
        grid-column-start: 2;
      }
      & :nth-child(2) {
        grid-column-start: 1;
      }
    }

    span {
      color: ${theme.colors.text.secondary};
    }
    span:hover {
      color: ${theme.colors.text.primary};
    }

    &.checked span {
      color: ${theme.colors.text.primary};
    }
  `,
});
