import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React, { useContext, useMemo } from 'react';

import { PyroscopeStateContext } from '../../../../app/domain/PyroscopeState/context';
import { Services } from '../infrastructure/useFetchServices';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    profileName: css`
      color: ${theme.colors.text.maxContrast};
      font-weight: bolder;
    `,
  };
};

export function useBuildProfileTypeOptions(services: Services) {
  const styles: ReturnType<typeof getStyles> = useStyles2(getStyles);

  const { selectedServiceName } = useContext(PyroscopeStateContext);
  const { selectedProfileType, setSelectedProfileType } = useContext(PyroscopeStateContext);

  const profileTypeOptions: Array<SelectableValue<string>> = useMemo(() => {
    const profileMetrics = selectedServiceName ? Array.from(services.get(selectedServiceName)?.values() || []) : [];

    return profileMetrics
      .sort((a, b) => a.type.localeCompare(b.type))
      .map((profileMetric) => ({
        value: profileMetric.id,
        // The underlying mechanism used by Grafana's <Select> accepts components for labels,
        // but the strict typing believes that it only accepts strings, so we lie about the type here.
        label: (
          <span className={styles.profileName}>
            {profileMetric.type} ({profileMetric.group})
          </span>
        ) as unknown as string,
        imgUrl: 'public/plugins/grafana-pyroscope-app/img/logo.svg',
      }));
  }, [selectedServiceName, services, styles.profileName]);

  return {
    profileTypeOptions,
    selectedProfileType,
    selectProfileType(selection: SelectableValue<string>) {
      setSelectedProfileType(selection.value || '');
    },
  };
}
