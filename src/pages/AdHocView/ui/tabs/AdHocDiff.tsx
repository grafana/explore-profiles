import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Alert, InlineField, InlineFieldRow, RadioButtonGroup, Select, useStyles2 } from '@grafana/ui';
import { reportInteraction } from '@shared/domain/reportInteraction';
import React, { useEffect, useMemo, useState } from 'react';

import { useDiffProfile } from '../../domain/useDiffProfile';
import { useUploadFile } from '../../domain/useUploadFile';
import { AdHocColumns } from '../AdHocColums';
import { AdHocFileDropZone } from '../AdHocFileDropZone';
import { AdHocFlameGraph } from '../AdHocFlameGraph';
import { AdHocSpinner } from '../AdHocSpinner';

type DiffMode = 'side-by-side' | 'diff';

const modeOptions: Array<SelectableValue<DiffMode>> = [
  { label: 'Side by side', value: 'side-by-side' },
  { label: 'Diff flamegraph', value: 'diff' },
];

const getStyles = (theme: GrafanaTheme2) => ({
  selectorContainer: css`
    display: flex;
    justify-content: center;
    margin-bottom: ${theme.spacing(2)};
  `,
  toolbar: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
    margin: ${theme.spacing(2)} 0;
  `,
});

export function AdHocDiff() {
  const styles = useStyles2(getStyles);
  const [mode, setMode] = useState<DiffMode>('side-by-side');
  const [selectedProfileType, setSelectedProfileType] = useState<string | undefined>();

  const left = useUploadFile();
  const right = useUploadFile();
  const diff = useDiffProfile();

  const leftProfileTypeOptions = useMemo(
    () => left.profileTypes.map((type) => ({ value: type, label: type })),
    [left.profileTypes]
  );

  const rightProfileTypeOptions = useMemo(
    () => right.profileTypes.map((type) => ({ value: type, label: type })),
    [right.profileTypes]
  );

  const commonProfileTypes = useMemo(() => {
    if (!left.profileTypes.length || !right.profileTypes.length) {
      return null;
    }
    return left.profileTypes.filter((t) => right.profileTypes.includes(t));
  }, [left.profileTypes, right.profileTypes]);

  const hasCommonTypes = commonProfileTypes === null || commonProfileTypes.length > 0;

  const [leftProfileTypeOption, setLeftProfileTypeOption] = useState<SelectableValue<string>>();
  const [rightProfileTypeOption, setRightProfileTypeOption] = useState<SelectableValue<string>>();

  useEffect(() => {
    if (!leftProfileTypeOptions.length) {
      setLeftProfileTypeOption(undefined);
      return;
    }
    const preserved = selectedProfileType
      ? leftProfileTypeOptions.find((opt) => opt.value === selectedProfileType)
      : undefined;
    const next = preserved ?? leftProfileTypeOptions[0];
    setLeftProfileTypeOption(next);
    setSelectedProfileType(next.value);
  }, [leftProfileTypeOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!rightProfileTypeOptions.length) {
      setRightProfileTypeOption(undefined);
      return;
    }
    const preserved = selectedProfileType
      ? rightProfileTypeOptions.find((opt) => opt.value === selectedProfileType)
      : undefined;
    setRightProfileTypeOption(preserved ?? rightProfileTypeOptions[0]);
  }, [rightProfileTypeOptions]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode === 'diff' && left.id && right.id && hasCommonTypes) {
      diff.fetchDiff(left.id, right.id, selectedProfileType);
    }
    // Only trigger on new uploads, not on mode/profile type changes (handled by their own callbacks)
  }, [left.id, right.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const syncProfileType = (
    option: SelectableValue<string>,
    secondary: typeof left,
    setSecondaryOption: typeof setLeftProfileTypeOption
  ) => {
    setSelectedProfileType(option.value);
    if (secondary.profileTypes.includes(option.value!)) {
      setSecondaryOption(option);
    }
  };

  const applySideBySideChange = async (
    option: SelectableValue<string>,
    primary: typeof left,
    secondary: typeof left
  ) => {
    const type = option.value!;
    const promises = [];
    if (primary.id) {
      promises.push(primary.selectProfileType(option));
    }
    if (secondary.id && secondary.profileTypes.includes(type)) {
      promises.push(secondary.selectProfileType(option));
    }
    await Promise.all(promises);
  };

  const applyProfileTypeChange = async (
    option: SelectableValue<string>,
    primary: typeof left,
    secondary: typeof left
  ) => {
    const type = option.value!;

    if (mode === 'side-by-side') {
      await applySideBySideChange(option, primary, secondary);
    } else if (left.id && right.id && commonProfileTypes?.includes(type)) {
      await diff.fetchDiff(left.id, right.id, type);
    }
  };

  const onModeChange = async (newMode: DiffMode) => {
    setMode(newMode);

    if (newMode === 'diff' && left.id && right.id && hasCommonTypes) {
      diff.fetchDiff(left.id, right.id, selectedProfileType);
    } else if (newMode === 'side-by-side' && selectedProfileType) {
      const option = { value: selectedProfileType };
      await applySideBySideChange(option, left, right);
    }
  };

  return (
    <>
      <AdHocColumns
        left={
          <>
            <div className={styles.selectorContainer}>
              <InlineFieldRow>
                <InlineField
                  label={t('ad-hoc.diff.profile', 'Profile')}
                  disabled={!leftProfileTypeOptions.length}
                  data-testid="profile-types-dropdown"
                >
                  <Select
                    key={leftProfileTypeOption?.value}
                    value={leftProfileTypeOption}
                    options={leftProfileTypeOptions}
                    onChange={(opt) => {
                      setLeftProfileTypeOption(opt);
                      syncProfileType(opt, right, setRightProfileTypeOption);
                      applyProfileTypeChange(opt, left, right);
                    }}
                    width={16}
                  />
                </InlineField>
              </InlineFieldRow>
            </div>
            <AdHocFileDropZone
              onFileDropped={left.processFile}
              onFileRemove={() => {
                reportInteraction('g_pyroscope_app_ad_hoc_file_removed');
                left.removeFile();
                diff.reset();
              }}
            />
          </>
        }
        right={
          <>
            <div className={styles.selectorContainer}>
              <InlineFieldRow>
                <InlineField
                  label={t('ad-hoc.diff.profile', 'Profile')}
                  disabled={!rightProfileTypeOptions.length}
                  data-testid="profile-types-dropdown"
                >
                  <Select
                    key={rightProfileTypeOption?.value}
                    value={rightProfileTypeOption}
                    options={rightProfileTypeOptions}
                    onChange={(opt) => {
                      setRightProfileTypeOption(opt);
                      syncProfileType(opt, left, setLeftProfileTypeOption);
                      applyProfileTypeChange(opt, right, left);
                    }}
                    width={16}
                  />
                </InlineField>
              </InlineFieldRow>
            </div>
            <AdHocFileDropZone
              onFileDropped={right.processFile}
              onFileRemove={() => {
                reportInteraction('g_pyroscope_app_ad_hoc_file_removed');
                right.removeFile();
                diff.reset();
              }}
            />
          </>
        }
      />

      <div className={styles.toolbar}>
        <RadioButtonGroup options={modeOptions} value={mode} onChange={onModeChange} />
      </div>

      {mode === 'side-by-side' && (
        <AdHocColumns
          left={
            <>
              {left.isLoading && !left.profile ? <AdHocSpinner /> : null}
              {left.profile && <AdHocFlameGraph profile={left.profile} />}
            </>
          }
          right={
            <>
              {right.isLoading && !right.profile ? <AdHocSpinner /> : null}
              {right.profile && <AdHocFlameGraph profile={right.profile} />}
            </>
          }
        />
      )}

      {mode === 'diff' && !hasCommonTypes && (
        <Alert title={t('ad-hoc.diff.cannot-compute-diff', 'Cannot compute diff')} severity="warning">
          {t(
            'ad-hoc.diff.no-common-profile-types',
            'The uploaded profiles have no common profile types. Upload profiles with matching types to use the diff view.'
          )}
        </Alert>
      )}

      {mode === 'diff' && hasCommonTypes && (
        <>
          {diff.isLoading && !diff.profile ? <AdHocSpinner /> : null}
          {diff.profile && <AdHocFlameGraph profile={diff.profile} diff={true} />}
        </>
      )}
    </>
  );
}
