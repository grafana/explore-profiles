import { css } from '@emotion/css';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { buildQuery, parseQuery } from '@shared/domain/url-params/parseQuery';
import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import React, { useMemo } from 'react';

import { Services } from '../../../infrastructure/services/servicesApiClient';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    profileName: css`
      color: ${theme.colors.text.maxContrast};
      font-weight: bolder;
    `,
  };
};

export function useBuildProfileTypeOptions(services: Services) {
  const styles = useStyles2(getStyles);

  const [query, setQuery] = useQueryFromUrl();
  const { service, profileType } = parseQuery(query);

  const profileTypeOptions: Array<SelectableValue<string>> = useMemo(() => {
    const profileMetrics = service ? Array.from(services.get(service)?.values() || []) : [];

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
  }, [service, services, styles.profileName]);

  return {
    profileTypeOptions,
    selectedProfileType: profileTypeOptions.length ? profileType : null,
    setProfileType(option: SelectableValue<string>) {
      const newProfileType = option.value || '';

      setQuery(buildQuery({ service, profileType: newProfileType }));
    },
  };
}
