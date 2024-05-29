import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Field, measureText, RadioButtonGroup, Select, useStyles2, useTheme2 } from '@grafana/ui';
import { useResizeObserver } from '@react-aria/utils';
import React, { useEffect, useRef, useState } from 'react';

type Props = {
  options: Array<SelectableValue<string>>;
  mainAttributes: string[];
  value?: string;
  onChange: (label: string) => void;
};

export function LabelSelector({ options, mainAttributes, value, onChange }: Props) {
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

  const mainOptions = mainAttributes
    .filter((at) => !!options.find((op) => op.value === at))
    .map((attribute) => ({
      label: attribute.replace('span.', '').replace('resource.', ''),
      text: attribute,
      value: attribute,
    }));

  const otherOptions = options.filter((op) => !mainAttributes.includes(op.value?.toString()!));

  const getModifiedOptions = (options: Array<SelectableValue<string>>) => {
    const ignoredAttributes = [{}];
    return options
      .filter((op) => !ignoredAttributes.includes(op.value?.toString()!))
      .map((op) => ({ label: op.label?.replace('span.', '').replace('resource.', ''), value: op.value }));
  };

  useEffect(() => {
    const { fontSize } = theme.typography;
    const text = mainOptions.map((option) => option.label || option.text || '').join(' ');
    const textWidth = measureText(text, fontSize).width;
    const additionalWidthPerItem = 70;
    setLabelSelectorRequiredWidth(textWidth + additionalWidthPerItem * mainOptions.length);
  }, [mainOptions, theme]);

  return (
    <Field label="Group by">
      <div ref={controlsContainer} className={styles.container}>
        {useHorizontalLabelSelector ? (
          <>
            <RadioButtonGroup
              options={[{ value: 'all', label: 'All' }, ...mainOptions]}
              value={value}
              onChange={onChange}
            />
            <Select
              value={value && getModifiedOptions(otherOptions).some((x) => x.value === value) ? value : null} // remove value from select when radio button clicked
              placeholder={'Other attributes'}
              options={getModifiedOptions(otherOptions)}
              onChange={(selected) => onChange(selected?.value ?? 'All')}
              className={styles.select}
              isClearable={true}
            />
          </>
        ) : (
          <Select
            value={value}
            placeholder={'Select attribute'}
            options={getModifiedOptions(options)}
            onChange={(selected) => onChange(selected?.value ?? 'All')}
            className={styles.select}
            isClearable={true}
          />
        )}
      </div>
    </Field>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: 'flex';
    gap: theme.spacing(1);
  `,
  select: css`
    max-width: ${theme.spacing(22)};
  `,
});
