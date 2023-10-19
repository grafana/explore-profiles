import React from 'react';
import { ParsedQuery } from './useParseQuery';
import { Query } from 'grafana-pyroscope/public/app/models/query';

export function useQueryInput(parsedQuery: ParsedQuery, onSubmit: (query: Query) => void) {
  const { profileMetric, query, setQuery } = parsedQuery;

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setQuery(e.target.value as Query);
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();

    const fullQuery = `${profileMetric.id}${query}` as Query;

    onSubmit(fullQuery);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      onFormSubmit(e);
    }
  };

  return {
    data: {
      profileMetric,
      query,
    },
    actions: {
      handleTextAreaChange,
      handleTextareaKeyDown,
      submitForm: onFormSubmit,
    },
  };
}
