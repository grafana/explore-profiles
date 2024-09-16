import { Commit, FunctionDetails } from './types/FunctionDetails';

export type CommitWithSamples = Commit & {
  samples: {
    unit: string;
    current: number;
    total: number;
  };
};

export function getCommitsWithSamples(functionsDetails: FunctionDetails[], totalSamples: number): CommitWithSamples[] {
  const commits = functionsDetails.map((details) => ({
    ...details.commit,
    samples: {
      unit: details.unit ?? 'count',
      current: Array.from(details.callSites.values()).reduce((acc, { cum }) => acc + cum, 0),
      total: totalSamples,
    },
  }));

  return commits;
}
