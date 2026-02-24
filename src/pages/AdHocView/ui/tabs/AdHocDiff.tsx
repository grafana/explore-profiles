import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { InlineField, InlineFieldRow, RadioButtonGroup, Select, useStyles2 } from '@grafana/ui';
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

  const profileTypes = useMemo(() => {
    if (left.profileTypes.length && right.profileTypes.length) {
      return left.profileTypes.filter((t) => right.profileTypes.includes(t));
    }
    return left.profileTypes.length ? left.profileTypes : right.profileTypes;
  }, [left.profileTypes, right.profileTypes]);

  const profileTypeOptions = useMemo(() => profileTypes.map((type) => ({ value: type, label: type })), [profileTypes]);

  const [profileTypeOption, setProfileTypeOption] = useState<SelectableValue<string>>();

  useEffect(() => {
    setProfileTypeOption(profileTypeOptions[0]);
  }, [profileTypeOptions]);

  useEffect(() => {
    if (mode === 'diff' && left.id && right.id) {
      diff.fetchDiff(left.id, right.id, selectedProfileType);
    }
  }, [left.id, right.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const onChangeProfileType = async (option: SelectableValue<string>) => {
    const type = option.value;
    setSelectedProfileType(type);
    setProfileTypeOption(option);

    if (mode === 'side-by-side') {
      if (left.id) {
        await left.selectProfileType(option);
      }
      if (right.id) {
        await right.selectProfileType(option);
      }
    } else if (left.id && right.id) {
      diff.fetchDiff(left.id, right.id, type);
    }
  };

  const onModeChange = async (newMode: DiffMode) => {
    setMode(newMode);

    if (newMode === 'diff' && left.id && right.id) {
      diff.fetchDiff(left.id, right.id, selectedProfileType);
    } else if (newMode === 'side-by-side' && selectedProfileType) {
      const option = { value: selectedProfileType };
      if (left.id) {
        await left.selectProfileType(option);
      }
      if (right.id) {
        await right.selectProfileType(option);
      }
    }
  };

  return (
    <>
      <AdHocColumns
        left={
          <>
            <div className={styles.selectorContainer}>
              <InlineFieldRow>
                <InlineField label="Profile" disabled={!profileTypeOptions.length}>
                  <Select
                    key={profileTypeOption?.value}
                    value={profileTypeOption}
                    options={profileTypeOptions}
                    onChange={onChangeProfileType}
                    width={16}
                  />
                </InlineField>
              </InlineFieldRow>
            </div>
            <AdHocFileDropZone
              onFileDropped={left.processFile}
              onFileRemove={() => {
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
                <InlineField label="Profile" disabled={!profileTypeOptions.length}>
                  <Select
                    key={profileTypeOption?.value}
                    value={profileTypeOption}
                    options={profileTypeOptions}
                    onChange={onChangeProfileType}
                    width={16}
                  />
                </InlineField>
              </InlineFieldRow>
            </div>
            <AdHocFileDropZone
              onFileDropped={right.processFile}
              onFileRemove={() => {
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

      {mode === 'diff' && (
        <>
          {diff.isLoading && !diff.profile ? <AdHocSpinner /> : null}
          {diff.profile && <AdHocFlameGraph profile={diff.profile} diff={true} />}
        </>
      )}
    </>
  );
}
