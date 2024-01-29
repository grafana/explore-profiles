import React, { useContext } from 'react';
import { Helmet } from 'react-helmet';

type PageTitleProps = {
  title: string;
};

const DEFAULT_APP_NAME = 'Pyroscope';

export const AppNameContext = React.createContext(DEFAULT_APP_NAME);

export function PageTitle({ title }: PageTitleProps) {
  const appName = useContext(AppNameContext);
  const fullTitle = `${title} | ${appName || DEFAULT_APP_NAME}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
    </Helmet>
  );
}
