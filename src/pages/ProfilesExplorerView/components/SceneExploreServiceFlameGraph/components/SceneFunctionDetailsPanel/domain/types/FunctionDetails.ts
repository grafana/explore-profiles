export type FunctionVersion = {
  repository: string;
  git_ref: string;
  root_path: string;
};

export type Commit = {
  author: {
    avatarURL: string;
    login: string;
  };
  date?: Date;
  message: string;
  sha: string;
  URL: string;
};

export type FunctionDetails = {
  name: string;
  version?: FunctionVersion;
  startLine?: number;
  fileName: string;
  callSites: Map<number, CallSiteProps>;
  unit: string;
  commit: Commit;
};

export type CallSiteProps = {
  line: number;
  flat: number;
  cum: number;
};

export type LineProfile = {
  line: string;
  number: number;
  cum: number;
  flat: number;
};
