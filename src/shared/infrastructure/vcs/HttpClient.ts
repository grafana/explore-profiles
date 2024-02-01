import { PprofProfile } from '../../domain/Profile';
import { ApiClient } from '../http/ApiClient';

type SelectMergeProfileProps = {
  profileType: string;
  labelSelector: string;
  start: number;
  end: number;
  stacktrace: string[];
};

class VcsClient extends ApiClient {
  async githubLogin(code: string): Promise<any> {
    const response = await this.fetch('/vcs.v1.VCSService/GithubLogin', {
      method: 'POST',
      body: JSON.stringify({
        authorizationCode: code,
      }),
    });

    return await response.json();
  }

  async githubApp(): Promise<string> {
    const response = await this.fetch('/vcs.v1.VCSService/GithubApp', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    return (await response.json()).clientID;
  }

  async getFile({ repository, ref, path }: { repository: string; ref: string; path: string }): Promise<any> {
    const response = await this.fetch('/vcs.v1.VCSService/GetFile', {
      method: 'POST',
      body: JSON.stringify({
        repositoryURL: repository,
        ref,
        localPath: path,
      }),
    });

    const json = await response.json();

    return json;
  }

  async selectMergeProfile({
    profileType,
    labelSelector,
    start,
    end,
    stacktrace,
  }: SelectMergeProfileProps): Promise<PprofProfile> {
    // {
    //   "profile_typeID": "process_cpu:cpu:nanoseconds:cpu:nanoseconds",
    //   "label_selector": "{service_name=\"pyroscope\"}",
    //   "start": 1706552499000,
    //   "end": 1706552599000,
    //   "stackTraceSelector": {
    //     "subtreeRoot": [
    //       {"name": "runtime.systemstack"},
    //       {"name": "runtime.gcBgMarkWorker.func2"}
    //     ]
    //   }
    // }

    const response = await this.fetch('/querier.v1.QuerierService/SelectMergeProfile', {
      method: 'POST',
      body: JSON.stringify({
        profile_typeID: profileType,
        label_selector: labelSelector,
        start,
        end,
        stackTraceSelector: {
          subtreeRoot: stacktrace.map((s) => {
            return { name: s };
          }),
        },
      }),
    });

    const json = await response.json();

    return json;
  }
}

export const vcsClient = new VcsClient();
