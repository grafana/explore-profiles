import React from 'react';
import { ParsedQuery } from './useParseQuery';
import { Query } from 'grafana-pyroscope/public/app/models/query';

export function useQueryInput(parsedQuery: ParsedQuery, onSubmit: (query: Query) => void) {
  const { profileMetric, query, setQuery } = parsedQuery;

  function handleTextAreaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setQuery(e.target.value as Query);
  }

  function submitForm(e: React.FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) {
    e.preventDefault();

    const fullQuery = `${profileMetric.id}${query}` as Query;

    onSubmit(fullQuery);
  }

  function handleTextareaKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter') {
      submitForm(e);
    }
  }

  return {
    data: {
      profileMetric,
      query,
    },
    actions: {
      handleTextAreaChange,
      handleTextareaKeyDown,
      submitForm,
    },
  };
}
