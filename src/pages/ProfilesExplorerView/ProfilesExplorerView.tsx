import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Spinner, Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import { InlineBanner } from '@shared/components/InlineBanner';
import { useTimeRangeFromUrl } from '@shared/domain/url-params/useTimeRangeFromUrl';
import { useFetchServices } from '@shared/infrastructure/services/useFetchServices';
import React, { useState } from 'react';

import { FavoritesList } from './components/Favorites/FavoritesList';
import { ProfilesList } from './components/Profiles/ProfilesList';
import { ServicesList } from './components/Services/ServicesList';

const getStyles = (theme: GrafanaTheme2) => ({
  tabContent: css`
    padding: ${theme.spacing(1)};
    margin: ${theme.spacing(1)};
    background: transparent;
  `,
});

export const ProfilesExplorerView = () => {
  const styles = useStyles2(getStyles);

  const [timeRange] = useTimeRangeFromUrl();
  const { isFetching, error, services } = useFetchServices({ timeRange });
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  if (isFetching) {
    return (
      <>
        <Spinner inline size="xl" />
        &nbsp;&nbsp;Loading...
      </>
    );
  }

  if (error) {
    return (
      <InlineBanner
        severity="error"
        title="Error while fetching services list!"
        message="Sorry for the inconvenience. Please try reloading the page."
        errors={[error]}
      />
    );
  }

  return (
    <div>
      <TabsBar>
        <Tab label="Services" active={activeTabIndex === 0} onChangeTab={() => setActiveTabIndex(0)} />
        <Tab label="Profile metrics" active={activeTabIndex === 1} onChangeTab={() => setActiveTabIndex(1)} />
        <Tab label="Favorites" active={activeTabIndex === 2} onChangeTab={() => setActiveTabIndex(2)} />
      </TabsBar>
      <TabContent className={styles.tabContent}>
        {activeTabIndex === 0 && <ServicesList timeRange={timeRange} services={services} />}
        {activeTabIndex === 1 && <ProfilesList timeRange={timeRange} services={services} />}
        {activeTabIndex === 2 && <FavoritesList timeRange={timeRange} services={services} />}
      </TabContent>
    </div>
  );
};
