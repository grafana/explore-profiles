import { DataSourceProxyClientBuilder } from '../../../../../infrastructure/series/http/DataSourceProxyClientBuilder';
import { PrivateVcsClient } from '../components/GitHubContextProvider/infrastructure/PrivateVcsClient';
import { FunctionDetails } from '../domain/types/FunctionDetails';

export async function fetchCommitsInfo(
  dataSourceUid: string,
  functionsDetails: FunctionDetails[]
): Promise<FunctionDetails[]> {
  const privateVcsClient = DataSourceProxyClientBuilder.build(dataSourceUid, PrivateVcsClient);

  const commits = functionsDetails.map((details) => ({
    repositoryUrl: details?.version?.repository || '',
    gitRef: details?.version?.git_ref || 'HEAD',
  }));

  // TODO: extract to its own hook and simplify useSceneFunctionDetailsPanel()?
  const commitsInfo = await privateVcsClient.getCommits(commits);

  commitsInfo.forEach((commit, i) => {
    functionsDetails[i].commit = commit;
  });

  return functionsDetails;
}
