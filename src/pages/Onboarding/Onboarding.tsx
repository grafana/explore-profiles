import React, { useState } from 'react';
import { useAppSelector } from '@pyroscope/redux/hooks';
import { selectAppNamesState } from '@pyroscope/redux/reducers/continuous';
import { Button, Modal, Icon } from '@grafana/ui';
import styles from './styles.module.scss';
import clsx from 'clsx';
import HeroImage from '../../img/hero-image.png';
import ResolveIncidents from '../../img/resolve-incidents.png';
import DecreaseLatency from '../../img/decrease-latency.png';
import ReduceCosts from '../../img/reduce-costs.png';

/**
 * Displays an onboarding dialog instructing how to push data
 * only when data is not present
 *
 * It assumes apps are loaded via a different component
 */
export function Onboarding({ children }: { children: React.ReactNode }) {
  const appNamesState = useAppSelector(selectAppNamesState);
  const [showModal, setShowModal] = useState(true);

  const noData = appNamesState.type === 'loaded' && appNamesState.data.length <= 0;
  const shouldShowOnboarding = noData && showModal;

  if (shouldShowOnboarding) {
    return (
      <div className={styles.onboardingPage}>
        <button
          className={styles.closeButton}
          onClick={() => {
            setShowModal(false);
          }}
        >
          &times;
        </button>
        <OnboardingPage />
      </div>
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
  return (
    <a className={styles.link} href={href} {...{ target: '_blank', rel: 'noreferrer' }}>
      {children} {<Icon name="external-link-alt" />}
    </a>
  );
}
