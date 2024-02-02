import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import React, { useCallback, useMemo } from 'react';

// TODO: move useQueryFromUrl.ts to shared/domain
import { useQueryFromUrl } from '../../../../pages/SingleView/domain/useQueryFromUrl';
import { Services } from '../infrastructure/useFetchServices';
import { useServiceFromQuery } from './useBuildServiceNameOptions';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    profileName: css`
      color: ${theme.colors.text.maxContrast};
      font-weight: bolder;
    `,
  };
};

export function useProfileTypeFromQuery(): [string, (newProfileType: string) => void] {
  const [query, setQuery] = useQueryFromUrl();
  const [, profileType] = query.match(/([^{]+)\{.*}/) || [];

  const setProfileType = useCallback(
    (newProfileType: string) => {
      const newQuery = query.replace(profileType, newProfileType);
      setQuery(newQuery);
    },
    [profileType, query, setQuery]
  );

  return [profileType, setProfileType];
}

export function useBuildProfileTypeOptions(services: Services) {
  const styles = useStyles2(getStyles);

  const [selectedService] = useServiceFromQuery();
  const [selectedProfileType, setProfileType] = useProfileTypeFromQuery();

  const profileTypeOptions: Array<SelectableValue<string>> = useMemo(() => {
    const profileMetrics = selectedService ? Array.from(services.get(selectedService)?.values() || []) : [];

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
  }, [selectedService, services, styles.profileName]);

  return {
    profileTypeOptions,
    selectedProfileType: selectedProfileType || profileTypeOptions[0]?.value,
    setProfileType(option: SelectableValue<string>) {
      setProfileType(option.value || '');
    },
  };
}
