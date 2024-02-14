import { css } from '@emotion/css';
import { GrafanaTheme2, PageLayoutType } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Icon, useStyles2 } from '@grafana/ui';
import clsx from 'clsx';
import React, { useState } from 'react';

import DecreaseLatency from '../../../img/decrease-latency.png';
import HeroImage from '../../../img/hero-image.png';
import ReduceCosts from '../../../img/reduce-costs.png';
import ResolveIncidents from '../../../img/resolve-incidents.png';
import { TitleReplacement } from '../TitleReplacement';
import { useDataPresentCheck } from './useDataPresentCheck';

/**
 * Displays an onboarding dialog instructing how to push data
 * only when data is not present
 *
 * It assumes apps are loaded via a different component
 */
export function Onboarding({ children }: { children: React.ReactNode }) {
  const [modalClosed, setModalClosed] = useState(false);

  const { determinedNoDataPresent, waiting, error } = useDataPresentCheck();

  const shouldShowOnboarding = determinedNoDataPresent && !error && !modalClosed;

  const styles = useStyles2(getStyles);

  if (waiting && !error) {
    return (
      <PluginPage renderTitle={loadingTitle} layout={PageLayoutType.Standard}>
        <></>
      </PluginPage>
    );
  }

  if (shouldShowOnboarding) {
    return (
      // The use of `PluginPage` is to set a clear "Onboarding" breadcrumb
      // Using `Custom` ensures that it takes up the whole page (and doesn't conflict with the other `PluginPage`)
      <PluginPage pageNav={{ text: 'Onboarding' }} layout={PageLayoutType.Custom}>
        <div className={styles.onboardingPage}>
          <button
            className={styles.closeButton}
            onClick={() => {
              setModalClosed(true);
            }}
          >
            &times;
          </button>
          <OnboardingPage />
        </div>
      </PluginPage>
    );
  }

  return <>{children}</>;
}

// TODO: improve this
async function getURL(): Promise<any> {
  const res = await fetch('/api/plugin-proxy/cloud-home-app/grafanacom-api/instances');
  return res.json();
}

function OnboardingPage() {
  const [url, setURL] = useState('https://grafana.com/auth/sign-in/');

  const styles = useStyles2(getStyles);

  getURL().then((x: any) => {
    if (x && x.orgSlug && x.hpInstanceId) {
      setURL(`https://grafana.com/orgs/${x.orgSlug}/hosted-profiles/${x.hpInstanceId}`);
    }
  });

  return (
    <>
      <div className={styles.hero}>
        <div className={styles.heroTitles}>
          <h1 className={styles.title}>Welcome to Grafana Cloud Profiles</h1>
          <h2 className={styles.subtitle}>
            Optimize infrastructure spend, simplify debugging, and enhance application performance
          </h2>
          {/* <Button>Continue to Pyroscope</Button> */}
        </div>
        <img src={HeroImage} className={styles.heroImage}></img>
      </div>

      <h3>What You Can Do</h3>
      <div className={styles.onboardingRow}>
        <div className={styles.onboardingPanel}>
          <img className={styles.onboardingPanelImage} src={ReduceCosts as any as string}></img>
          <h3 className={styles.onboardingPanelHeader}>Reduce Costs</h3>
          <p className={styles.onboardingPanelDescription}>
            Spot CPU spikes, memory leaks, and other inefficiencies with code-level visibility into resource usage.
            Teams can then optimize their code and lower infrastructure costs.
          </p>
        </div>
        <div className={styles.onboardingPanel}>
          <img className={styles.onboardingPanelImage} src={DecreaseLatency as any as string}></img>
          <h3 className={styles.onboardingPanelHeader}>Decrease Latency</h3>
          <p className={styles.onboardingPanelDescription}>
            Maintain high speed and efficiency and improve application performance. In a competitive digital world,
            decreasing latency translates to increasing revenue.
          </p>
        </div>
        <div className={styles.onboardingPanel}>
          <img className={styles.onboardingPanelImage} src={ResolveIncidents as any as string}></img>
          <h3 className={styles.onboardingPanelHeader}>Resolve Incidents Faster</h3>
          <p className={styles.onboardingPanelDescription}>
            Cut down the mean time to resolution (MTTR) by correlating continuous profiling data with metrics, logs, and
            traces to quickly identify the root cause of any issue.
          </p>
        </div>
      </div>

      <h3>How to Get Started</h3>
      <div className={styles.onboardingRow}>
        <div className={styles.onboardingPanel}>
          <div className={styles.onboardingPanelNumber}>
            <span className={styles.onboardingPanelNumberSpan}>1</span>
          </div>
          <h3 className={styles.onboardingPanelHeader}>Add Profiling to Your Application</h3>
          <p className={styles.onboardingPanelDescription}>
            Use{' '}
            <StyledLink href="https://grafana.com/docs/pyroscope/next/configure-client/grafana-agent/">
              Grafana Agent
            </StyledLink>{' '}
            or{' '}
            <StyledLink href="https://grafana.com/docs/pyroscope/next/configure-client/language-sdks/">
              Pyroscope SDKs
            </StyledLink>{' '}
            to push profiles from your applications to Grafana Cloud.
          </p>
        </div>
        <div className={styles.onboardingPanel}>
          <div className={clsx(styles.onboardingPanelNumber, styles.color2)}>
            <span className={styles.onboardingPanelNumberSpan}>2</span>
          </div>
          <h3 className={styles.onboardingPanelHeader}>Configure Your Applications</h3>
          <p className={styles.onboardingPanelDescription}>
            Go to <StyledLink href={url}>Grafana Cloud Stack settings</StyledLink> to find your Grafana Cloud
            Credentials.
          </p>
        </div>
        <div className={styles.onboardingPanel}>
          <div className={clsx(styles.onboardingPanelNumber, styles.color3)}>
            <span className={styles.onboardingPanelNumberSpan}>3</span>
          </div>
          <h3 className={styles.onboardingPanelHeader}>Start Getting Performance Insights</h3>
          <p className={styles.onboardingPanelDescription}>
            Once you&apos;re done with initial setup, refresh this page to see your profiling data.
          </p>
        </div>
      </div>

      <h3>How Billing Works</h3>
      <div className={styles.onboardingRow}>
        <p className={styles.onboardingParagraph}>
          Usage of Grafana Cloud Profiles is subject to{' '}
          <StyledLink href="https://grafana.com/pricing/">Grafana Cloud Pricing</StyledLink> for Profiles.
          <br></br>
          For additional information, read the announcement&nbsp;
          <StyledLink href="https://grafana.com/blog/2023/08/09/grafana-cloud-profiles-for-continuous-profiling/">
            blog post
          </StyledLink>
          .
        </p>
      </div>
    </>
  );
}

function StyledLink({ href, children }: { href: string; children: React.ReactNode }) {
  const styles = useStyles2(getStyles);

  return (
    <a className={styles.link} href={href} {...{ target: '_blank', rel: 'noreferrer' }}>
      {children} {<Icon name="external-link-alt" />}
    </a>
  );
}

/** This was extracted from the former `styles.module.scss` */
// TODO Use more spacial and color parameters from `theme`
const getStyles = (theme: GrafanaTheme2) => ({
  onboardingPage: css`
    padding: 16px;
    margin: 64px;
    position: relative;
    background-color: ${theme.colors.background.primary};
  `,
  closeButton: css`
    position: absolute;
    top: -30px;
    opacity: 0.8;
    right: -32px;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    line-height: 40px;
    display: block;
    padding: 0;
    margin: 0;
    font-size: 22px;
  `,

  onboardingRow: css`
    background: ${theme.colors.background.secondary};
    display: flex;
    margin-top: 16px;
    gap: 20px;
    padding: 20px;
    margin-bottom: 2.5rem;
  `,

  onboardingParagraph: css`
    padding: 20px 64px;
    text-align: center;
    line-height: 2;
    flex: 1;
    margin: 0;
  `,

  onboardingPanel: css`
    flex: 1;
    display: flex;
    flex-flow: column wrap;
    -webkit-box-align: center;
    align-items: center;
    margin-top: 16px;
    text-align: center;
  `,
  onboardingPanelHeader: css`
    line-height: 1.5;
    margin-bottom: 1em;
  `,
  onboardingPanelImage: css`
    width: 5rem;
    margin-bottom: 1em;
  `,

  hero: css`
    display: flex;
    flex-direction: row;
  `,

  heroTitles: css`
    flex: 1;
  `,

  heroImage: css`
    width: 40%;
    margin-left: 16px;
    margin-top: 16px;
    margin-bottom: 16px;
    border-radius: 3px;
  `,

  onboardingPanelNumber: css`
    color: rgb(236, 109, 19);
    text-align: center;
    display: grid;
    place-items: center;
    background-image: linear-gradient(135deg, currentcolor, 75%, rgb(204, 204, 220));
    border-radius: 100%;
    font-size: 2.5rem;
    line-height: 5rem;
    height: 5rem;
    width: 5rem;
    margin-bottom: 1em;
  `,

  // TODO use theme.colors
  color2: css`
    color: rgb(190, 85, 190);
  `,
  // TODO use theme.colors
  color3: css`
    color: rgb(126, 108, 218);
  `,
  // FIXME use theme.colors
  onboardingPanelNumberSpan: css`
    color: rgb(220, 220, 220);
  `,

  onboardingPanelDescription: css`
    text-align: justify;
    text-align: center;
    line-height: 1.66;
    margin-top: 0;
  `,

  link: css`
    color: ${theme.colors.text.link};
    &:hover {
      text-decoration: underline;
    }
  `,
  title: css`
    margin-bottom: 0.5em;
    line-height: 1.5;
  `,
  subtitle: css`
    margin-bottom: 1em;
    line-height: 1.5;
    font-size: 1.25rem;
  `,
  clearfix: css`
    clear: both;
  `,
});

const loadingTitle = () => (
  <TitleReplacement
    title={
      (
        <span>
          Loading... <Icon name="fa fa-spinner" />
        </span>
      ) as unknown as string
    }
  />
);
