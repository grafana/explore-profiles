import { SelectableValue } from '@grafana/data';
import { FormatOptionLabelMeta, Select } from '@grafana/ui';
import React from 'react';

import { PLACEHOLDER_COMMIT_DATA } from '../components/GitHubContextProvider/infrastructure/PrivateVcsClient';
import { CommitWithSamples } from '../domain/getCommitsWithSamples';
import { CommitOption } from './CommitOption';
import { CommitOptionSelected } from './CommitOptionSelected';

type CommitSelectProps = {
  commits: CommitWithSamples[];
  selectedCommit: CommitWithSamples;
  onChange: (commit: CommitWithSamples) => void;
};

export function CommitSelect({ commits, selectedCommit, onChange }: CommitSelectProps) {
  return (
    <Select
      options={commits.map((commit) => ({
        label: commit.sha,
        value: commit,
      }))}
      value={{
        label: selectedCommit.sha,
        value: selectedCommit,
      }}
      hideSelectedOptions
      isSearchable={false}
      noOptionsMessage="No commits found"
      formatOptionLabel={formatOption}
      onChange={(item) => {
        if (item.value) {
          onChange(item.value);
        }
      }}
    />
  );
}

function formatOption(
  item: SelectableValue<CommitWithSamples>,
  formatOptionMeta: FormatOptionLabelMeta<CommitWithSamples>
) {
  const { value: commit } = item;

  if (!commit) {
    return null;
  }

  const isSelected = formatOptionMeta.selectValue[0]?.value === commit;

  return isSelected ? <CommitOptionSelected commit={commit} /> : <CommitOption commit={commit} />;
}

export const getCommitShortSha = (sha: string): string => {
  return sha === PLACEHOLDER_COMMIT_DATA.sha ? sha : sha.substring(0, 7);
};

export const getCommitShortMessage = (message: string): string => {
  return message.split('\n')[0];
};
