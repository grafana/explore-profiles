import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Field, measureText, RadioButtonGroup, RefreshPicker, Select, useStyles2, useTheme2 } from '@grafana/ui';
import { useResizeObserver } from '@react-aria/utils';
import { noOp } from '@shared/domain/noOp';
import React, { useEffect, useRef, useState } from 'react';

import { GroupByVariable } from './GroupByVariable';

type Props = {
  options: Array<SelectableValue<string>>;
  mainLabels: string[];
  value?: string;
  onChange: (label: string) => void;
  onRefresh: () => void;
};

export function GroupBySelector({ options, mainLabels, value, onChange, onRefresh }: Props) {
  const styles = useStyles2(getStyles);
  const theme = useTheme2();

  const [labelSelectorRequiredWidth, setLabelSelectorRequiredWidth] = useState<number>(0);
  const [availableWidth, setAvailableWidth] = useState<number>(0);

  const useHorizontalLabelSelector = availableWidth > labelSelectorRequiredWidth;

  const controlsContainer = useRef<HTMLDivElement>(null);

  useResizeObserver({
    ref: controlsContainer,
    onResize: () => {
      const element = controlsContainer.current;
      if (element) {
        setAvailableWidth(element.clientWidth);
      }
    },
  });

  const mainOptions = options.filter((o) => mainLabels.includes(o.value as string));
  const otherOptions = options.filter((o) => !mainLabels.includes(o.value as string));

  useEffect(() => {
    const { fontSize } = theme.typography;
    const text = mainOptions.map((option) => option.label || option.text || '').join(' ');
    const textWidth = measureText(text, fontSize).width;
    const additionalWidthPerItem = 70;
    setLabelSelectorRequiredWidth(textWidth + additionalWidthPerItem * mainOptions.length);
  }, [mainOptions, theme]);

  return (
    <Field label="Group by labels">
      <div ref={controlsContainer} className={styles.container}>
        {useHorizontalLabelSelector ? (
          <>
            <RadioButtonGroup aria-label="Labels selector" options={mainOptions} value={value} onChange={onChange} />
            <Select
              aria-label="Other labels selector"
              className={styles.select}
              placeholder="Other labels"
              options={otherOptions}
              value={value && otherOptions.some((x) => x.value === value) ? value : null} // remove value from select when radio button clicked
              onChange={(selected) => onChange(selected?.value ?? 'all')}
              isClearable
            />
          </>
        ) : (
          <Select
            aria-label="Labels selector"
            className={styles.select}
            value={value}
            placeholder="Select label"
            options={options}
            onChange={(selected) => onChange(selected?.value || GroupByVariable.DEFAULT_VALUE)}
            isClearable
          />
        )}
        <RefreshPicker
          noIntervalPicker
          onRefresh={onRefresh}
          isOnCanvas={false}
          onIntervalChanged={noOp}
          tooltip="Click to refresh all labels"
        />
      </div>
    </Field>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: flex;
    gap: ${theme.spacing(1)};
  `,
  select: css`
    max-width: ${theme.spacing(22)};
  `,
});
