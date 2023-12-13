import React, { memo } from 'react';
import { css } from '@emotion/css';
import { ChicletAttributeOperatorValue } from './ChicletAttributeOperatorValue';
import { PartialChiclet } from './PartialChiclet';
import { FilterPartKind, FilterKind, CompleteFilter, Filter } from '../../domain/types';
import { GrafanaTheme2 } from '@grafana/data';
import { ChicletAttributeOperator } from './ChicletAttributeOperator';

type ChicletProps = {
  filter: Filter;
  onClick: (event: React.MouseEvent<HTMLElement>, filter: Filter, part: FilterPartKind) => void;
  onRemove: (event: React.MouseEvent<HTMLElement>, filter: CompleteFilter) => void;
};

const chicletStyle = css`
  display: flex;
  margin: 4px 4px 0 0;
  align-items: center;
  border: 1px solid #3d71d9;
  border-radius: 2px;
  & > button {
    height: 30px;
    background-color: transparent;
  }
  & > :first-child {
    background-color: #3d71d9;
    border-radius: 0;
  }
  & > :last-child {
    border-left: 1px solid #3d71d9;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
`;

const partialChicletStyle = css`
  ${chicletStyle};
  border-color: #6e6e6e;
  border-right: 0;
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
  & > :first-child {
    background-color: #6e6e6e;
    border-radius: 0;
  }
  & > :last-child {
    border-color: #6e6e6e;
  }
`;

const inactiveChicletStyle = css`
  ${chicletStyle};
  border-color: #6e6e6e;
  & > :first-child {
    background-color: #6e6e6e;
  }
  & > :last-child {
    border-color: #6e6e6e;
  }
`;

const noHoverStyle = css`
  &:hover {
    opacity: 1 !important;
    cursor: default !important;
  }
`;

// TODO: use the Grafana theme
// eslint-disable-next-line no-unused-vars
export const getStyles = (theme: GrafanaTheme2) => ({
  chicletStyle,
  partialChicletStyle,
  inactiveChicletStyle,
  chicletAttributeStyle: noHoverStyle,
  chicletRemoveButtonStyle: css`
    & svg {
      width: 12px;
      height: 12px;
    }
  `,
});

const ChicletComponent = ({ filter, onClick, onRemove }: ChicletProps) => {
  switch (filter.type) {
    case FilterKind.partial:
      return <PartialChiclet filter={filter} onClick={onClick} />;

    case FilterKind['attribute-operator-value']:
      return <ChicletAttributeOperatorValue filter={filter as CompleteFilter} onClick={onClick} onRemove={onRemove} />;

    case FilterKind['attribute-operator']:
      return <ChicletAttributeOperator filter={filter as CompleteFilter} onClick={onClick} onRemove={onRemove} />;

    default:
      throw new TypeError(`Unsupported filter type "${filter.type}" (${JSON.stringify(filter)})!`);
  }
};

export const Chiclet = memo(
  ChicletComponent,
  (prevProps, nextProps) => JSON.stringify(prevProps.filter) === JSON.stringify(nextProps.filter)
);
