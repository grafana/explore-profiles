import { Query } from '@pyroscope/models/query';
import { useAppSelector } from '@pyroscope/redux/hooks';
import { selectContinuousState, TagsState } from '@pyroscope/redux/reducers/continuous';
import { formatAsOBject } from 'grafana-pyroscope/public/app/util/formatDate';
import React from 'react';
import 'react-dom';

import { QueryBuilder } from './QueryBuilder/QueryBuilder';

export type TagsBarProps = {
  /** the current query */
  query: Query;
  /** the state with existing tags */
  tags: TagsState;
  /** callback for when a label is selected */
  onSelectedLabel: (label: string, query: Query) => void;
  /** callback for when a new query is selected */
  onSetQuery: (q: string) => void;
  /** callback for when the same query is submitted again */
  onRefresh: () => void;
};

export default function TagsBar(props: TagsBarProps) {
  const { query, onSetQuery } = props;
  const { from, until } = useAppSelector(selectContinuousState);

  return (
    <QueryBuilder
      id="query-builder-single"
      query={query}
      // This means that every time, this component re-renders, we pass new "from" and "until" values to QueryBuilder ;)
      from={formatAsOBject(from).getTime()}
      until={formatAsOBject(until).getTime()}
      onChangeQuery={onSetQuery}
    />
  );
}
