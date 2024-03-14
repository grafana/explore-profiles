/**
 * Converts raw.githubusercontent.com URLS to github.com URLs.
 *
 * E.g. https://raw.githubusercontent.com/golang/go/master/src/runtime/netpoll_kqueue.go
 * needs to be to transformed to: https://github.com/{org}/{repo}/blob/{filepath}
 */
export function buildGithubUrlForFunction(url: string, startLine: unknown): string {
  let newUrl = url;

  const matches = url.match(/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/(.+)/);
  if (matches) {
    const [, org, repo, rest] = matches;
    newUrl = `https://github.com/${org}/${repo}/blob/${rest}`;
  }

  if (startLine !== undefined && !url.includes('#')) {
    // link to the specific line this function exists at
    newUrl += `#L${startLine}`;
  }

  return newUrl;
}
