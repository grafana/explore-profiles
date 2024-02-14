import { useQueryFromUrl } from '@shared/domain/url-params/useQueryFromUrl';
import React, { memo } from 'react';
import { Helmet } from 'react-helmet';

type PageTitleProps = {
  title: string;
};

function PageTitleComponent({ title }: PageTitleProps) {
  const [query] = useQueryFromUrl();
  const fullTitle = `${title} | ${query} | Pyroscope`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
    </Helmet>
  );
}

export const PageTitle = memo(PageTitleComponent);
