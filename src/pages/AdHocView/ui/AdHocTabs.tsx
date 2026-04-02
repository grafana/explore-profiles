import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Tab, TabContent, TabsBar, useStyles2 } from '@grafana/ui';
import React, { useState } from 'react';

import { AdHocComparison } from './tabs/AdHocComparison';
import { AdHocSingle } from './tabs/AdHocSingle';

// import { AdHocDiff } from './tabs/AdHocDiff';

const getStyles = (theme: GrafanaTheme2) => ({
  tabContent: css`
    padding: ${theme.spacing(2)};
    margin: ${theme.spacing(2)};
  `,
});

export function AdHocTabs() {
  const styles = useStyles2(getStyles);
  const [activeTabIndex, setActiveTabIndex] = useState(0);

  return (
    <div>
      <TabsBar>
        <Tab
          label={t('ad-hoc.tabs.single-view', 'Single view')}
          active={activeTabIndex === 0}
          onChangeTab={() => setActiveTabIndex(0)}
        />
        <Tab
          label={t('ad-hoc.tabs.comparison-view', 'Comparison view')}
          active={activeTabIndex === 1}
          onChangeTab={() => setActiveTabIndex(1)}
        />
        {/* <Tab
          label=" Diff view"
          active={activeTabIndex === 2}
          onChangeTab={onChangeTab(2)}
        /> */}
      </TabsBar>
      <TabContent className={styles.tabContent}>
        {activeTabIndex === 0 && <AdHocSingle />}
        {activeTabIndex === 1 && <AdHocComparison />}
        {/* {activeTabIndex === 2 && <AdHocDiff  />} */}
      </TabContent>
    </div>
  );
}
