import { DataSourceProxyClientBuilder } from '../../../../../infrastructure/series/http/DataSourceProxyClientBuilder';
import { PrivateVcsClient } from '../components/GitHubContextProvider/infrastructure/PrivateVcsClient';
import { FunctionDetails, FunctionVersion } from '../domain/types/FunctionDetails';

export async function fetchCommitsInfo(
  dataSourceUid: string,
  functionsDetails: FunctionDetails[],
  defaultFunctionVersion: FunctionVersion
): Promise<FunctionDetails[]> {
  const privateVcsClient = DataSourceProxyClientBuilder.build(dataSourceUid, PrivateVcsClient);

  const commits = functionsDetails.map((details) => ({
    repositoryUrl: details?.version?.repository || defaultFunctionVersion.repository,
    gitRef: details?.version?.git_ref || defaultFunctionVersion.git_ref,
    rootPath: details?.version?.root_path || defaultFunctionVersion.root_path,
  }));

  // TODO: extract to its own hook and simplify useSceneFunctionDetailsPanel()?
  const commitsInfo = await privateVcsClient.getCommits(commits);

  commitsInfo.forEach((commit, i) => {
    functionsDetails[i].commit = commit;
  });

  return functionsDetails;
}
