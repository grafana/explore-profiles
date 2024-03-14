import { css, cx } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Dropdown, Input, Menu, RadioButtonGroup, useStyles2 } from '@grafana/ui';
import React, { useEffect, useState } from 'react';
import useDebounce from 'react-use/lib/useDebounce';
import usePrevious from 'react-use/lib/usePrevious';

import { MIN_WIDTH_TO_SHOW_BOTH_TOPTABLE_AND_FLAMEGRAPH } from './constants';
import { byPackageGradient, byValueGradient, diffColorBlindGradient, diffDefaultGradient } from './FlameGraph/colors';
import { ColorScheme, ColorSchemeDiff, SelectedView, TextAlign } from './types';

type Props = {
  search: string;
  setSearch: (search: string) => void;
  selectedView: SelectedView;
  setSelectedView: (view: SelectedView) => void;
  containerWidth: number;
  onReset: () => void;
  textAlign: TextAlign;
  onTextAlignChange: (align: TextAlign) => void;
  showResetButton: boolean;
  colorScheme: ColorScheme | ColorSchemeDiff;
  onColorSchemeChange: (colorScheme: ColorScheme | ColorSchemeDiff) => void;
  stickyHeader: boolean;
  vertical?: boolean;
  isDiffMode: boolean;

  extraHeaderElements?: React.ReactNode;
};

const FlameGraphHeader = ({
  search,
  setSearch,
  selectedView,
  setSelectedView,
  containerWidth,
  onReset,
  textAlign,
  onTextAlignChange,
  showResetButton,
  colorScheme,
  onColorSchemeChange,
  stickyHeader,
  extraHeaderElements,
  vertical,
  isDiffMode,
}: Props) => {
  const styles = useStyles2(getStyles, stickyHeader);
  const [localSearch, setLocalSearch] = useSearchInput(search, setSearch);

  const suffix =
    localSearch !== '' ? (
      <Button
        icon="times"
        fill="text"
        size="sm"
        onClick={() => {
          // We could set only one and wait them to sync but there is no need to debounce this.
          setSearch('');
          setLocalSearch('');
        }}
      >
        Clear
      </Button>
    ) : null;

  return (
    <div className={styles.header}>
      <div className={styles.inputContainer}>
        <Input
          value={localSearch || ''}
          onChange={(v) => {
            setLocalSearch(v.currentTarget.value);
          }}
          placeholder={'Search...'}
          suffix={suffix}
        />
      </div>

      <div className={styles.rightContainer}>
        {showResetButton && (
          <Button
            variant={'secondary'}
            fill={'outline'}
            size={'sm'}
            icon={'history-alt'}
            tooltip={'Reset focus and sandwich state'}
            onClick={() => {
              onReset();
            }}
            className={styles.buttonSpacing}
            aria-label={'Reset focus and sandwich state'}
          />
        )}
        <ColorSchemeButton value={colorScheme} onChange={onColorSchemeChange} isDiffMode={isDiffMode} />
        <RadioButtonGroup<TextAlign>
          size="sm"
          disabled={selectedView === SelectedView.TopTable}
          options={alignOptions}
          value={textAlign}
          onChange={onTextAlignChange}
          className={styles.buttonSpacing}
        />
        <RadioButtonGroup<SelectedView>
          size="sm"
          options={getViewOptions(containerWidth, vertical)}
          value={selectedView}
          onChange={setSelectedView}
        />
        {extraHeaderElements && <div className={styles.extraElements}>{extraHeaderElements}</div>}
      </div>
    </div>
  );
};

type ColorSchemeButtonProps = {
  value: ColorScheme | ColorSchemeDiff;
  onChange: (colorScheme: ColorScheme | ColorSchemeDiff) => void;
  isDiffMode: boolean;
};
function ColorSchemeButton(props: ColorSchemeButtonProps) {
  // TODO: probably create separate getStyles
  const styles = useStyles2(getStyles, false);
  let menu = (
    <Menu>
      <Menu.Item label="By package name" onClick={() => props.onChange(ColorScheme.PackageBased)} />
      <Menu.Item label="By value" onClick={() => props.onChange(ColorScheme.ValueBased)} />
    </Menu>
  );

  if (props.isDiffMode) {
    menu = (
      <Menu>
        <Menu.Item label="Default (green to red)" onClick={() => props.onChange(ColorSchemeDiff.Default)} />
        <Menu.Item label="Color blind (blue to red)" onClick={() => props.onChange(ColorSchemeDiff.DiffColorBlind)} />
      </Menu>
    );
  }

  // Show a bit different gradient as a way to indicate selected value
  const colorDotStyle =
    {
      [ColorScheme.ValueBased]: styles.colorDotByValue,
      [ColorScheme.PackageBased]: styles.colorDotByPackage,
      [ColorSchemeDiff.DiffColorBlind]: styles.colorDotDiffColorBlind,
      [ColorSchemeDiff.Default]: styles.colorDotDiffDefault,
    }[props.value] || styles.colorDotByValue;

  return (
    <Dropdown overlay={menu}>
      <Button
        variant={'secondary'}
        fill={'outline'}
        size={'sm'}
        tooltip={'Change color scheme'}
        onClick={() => {}}
        className={styles.buttonSpacing}
        aria-label={'Change color scheme'}
      >
        <span className={cx(styles.colorDot, colorDotStyle)} />
      </Button>
    </Dropdown>
  );
}

const alignOptions: Array<SelectableValue<TextAlign>> = [
  { value: 'left', description: 'Align text left', icon: 'align-left' },
  { value: 'right', description: 'Align text right', icon: 'align-right' },
];

function getViewOptions(width: number, vertical?: boolean): Array<SelectableValue<SelectedView>> {
  let viewOptions: Array<{ value: SelectedView; label: string; description: string }> = [
    { value: SelectedView.TopTable, label: 'Top Table', description: 'Only show top table' },
    { value: SelectedView.FlameGraph, label: 'Flame Graph', description: 'Only show flame graph' },
  ];

  if (width >= MIN_WIDTH_TO_SHOW_BOTH_TOPTABLE_AND_FLAMEGRAPH || vertical) {
    viewOptions.push({
      value: SelectedView.Both,
      label: 'Both',
      description: 'Show both the top table and flame graph',
    });
  }

  return viewOptions;
}

function useSearchInput(
  search: string,
  setSearch: (search: string) => void
): [string | undefined, (search: string) => void] {
  const [localSearchState, setLocalSearchState] = useState(search);
  const prevSearch = usePrevious(search);

  // Debouncing cause changing parent search triggers rerender on both the flamegraph and table
  useDebounce(
    () => {
      setSearch(localSearchState);
    },
    250,
    [localSearchState]
  );

  // Make sure we still handle updates from parent (from clicking on a table item for example). We check if the parent
  // search value changed to something that isn't our local value.
  useEffect(() => {
    if (prevSearch !== search && search !== localSearchState) {
      setLocalSearchState(search);
    }
  }, [search, prevSearch, localSearchState]);

  return [localSearchState, setLocalSearchState];
}

const getStyles = (theme: GrafanaTheme2, sticky?: boolean) => ({
  header: css`
    label: header;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    width: 100%;
    top: 0;
    ${sticky
      ? css`
          z-index: ${theme.zIndex.navbarFixed};
          position: sticky;
          padding-bottom: ${theme.spacing(1)};
          padding-top: ${theme.spacing(1)};
          background: ${theme.colors.background.primary};
        `
      : ''};
  `,
  inputContainer: css`
    label: inputContainer;
    margin-right: 20px;
    flex-grow: 1;
    min-width: 150px;
    max-width: 350px;
  `,
  rightContainer: css`
    label: rightContainer;
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
  `,
  buttonSpacing: css`
    label: buttonSpacing;
    margin-right: ${theme.spacing(1)};
  `,

  resetButton: css`
    label: resetButton;
    display: flex;
    margin-right: ${theme.spacing(2)};
  `,
  resetButtonIconWrapper: css`
    label: resetButtonIcon;
    padding: 0 5px;
    color: ${theme.colors.text.disabled};
  `,
  colorDot: css`
    label: colorDot;
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 50%;
  `,
  colorDotByValue: css`
    label: colorDotByValue;
    background: ${byValueGradient};
  `,
  colorDotByPackage: css`
    label: colorDotByPackage;
    background: ${byPackageGradient};
  `,
  colorDotDiffDefault: css`
    label: colorDotDiffDefault;
    background: ${diffDefaultGradient};
  `,
  colorDotDiffColorBlind: css`
    label: colorDotDiffColorBlind;
    background: ${diffColorBlindGradient};
  `,
  extraElements: css`
    label: extraElements;
    margin-left: ${theme.spacing(1)};
  `,
});

export default FlameGraphHeader;
