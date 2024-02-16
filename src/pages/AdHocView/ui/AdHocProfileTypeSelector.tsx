import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { InlineField, InlineFieldRow, Select, useStyles2 } from '@grafana/ui';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

type ProfileSelectorProps = {
  profileTypes: string[];
  onChange: (options: SelectableValue<string>) => void;
};

const getStyles = (theme: GrafanaTheme2) => ({
  selectorContainer: css`
    display: flex;
    justify-content: center;
    margin-bottom: ${theme.spacing(2)};
  `,
});

export function AdHocProfileTypeSelector({ profileTypes, onChange }: ProfileSelectorProps) {
  const styles = useStyles2(getStyles);

  const options = useMemo(() => profileTypes.map((type) => ({ value: type, label: type })), [profileTypes]);
  const [option, setOption] = useState<SelectableValue<string>>();

  const _onChange = useCallback(
    (o: SelectableValue<string>) => {
      setOption(o);
      onChange(o);
    },
    [onChange]
  );

  useEffect(() => {
    // when the uploaded file contains multiple sample types, the 1st is always returned by the API
    // so, we select it automatically
    setOption(options[0]);
  }, [options]);

  return (
    <div className={styles.selectorContainer}>
      <InlineFieldRow>
        <InlineField label="Profile" disabled={!options.length} data-testid="profile-types-dropdown">
          {/* added a key to ensure the dropdown is properly reset */}
          <Select key={option?.value} value={option} options={options} onChange={_onChange} width={16} />
        </InlineField>
      </InlineFieldRow>
    </div>
  );
}
