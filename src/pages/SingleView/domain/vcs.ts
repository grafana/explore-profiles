import { PprofProfile } from '../../../shared/domain/Profile';
import { vcsClient } from '../../../shared/infrastructure/vcs/HttpClient';

export function splitQueryProfileTypeAndLabelSelector(query: string): string[] {
  const [profileType, labelSelector] = query.split('{', 2);
  return [profileType, '{' + labelSelector]; // Gotta put back the '{' after it got removed with the split
}

export type FunctionVersion = {
  repository: string;
  git_ref: string;
};

export type CodeMappingProps = {
  unit: string;
  lines: Line[];
};

type Line = {
  line: string;
  number: number;
  cum: number;
  flat: number;
};

export class FunctionDetails {
  name: string;
  version: string;
  startLine: number;
  fileName: string;
  callSites: Map<number, CallSite>;
  unit: string;

  constructor(
    name: string,
    version: string,
    startLine: number,
    fileName: string,
    callSites: Map<number, CallSite>,
    unit: string
  ) {
    this.name = name;
    this.version = version;
    this.startLine = startLine;
    this.fileName = fileName;
    this.callSites = callSites;
    this.unit = unit;
  }

  Version(): FunctionVersion | undefined {
    if (!this.version) {
      return undefined;
    }
    return JSON.parse(this.version);
  }

  Cum(): number {
    return Array.from(this.callSites.values()).reduce((acc, { cum }) => acc + cum, 0);
  }

  Flat(): number {
    return Array.from(this.callSites.values()).reduce((acc, { flat }) => acc + flat, 0);
  }

  Map(code: string): CodeMappingProps {
    const allLines = atob(code).split('\n');
    // sort call site
    let callSites = Array.from(this.callSites.values()).sort((a, b) => a.line - b.line);
    // leaves space around  first and last call sites
    const space = 5;
    let first = callSites[0].line - space;
    let last = callSites[callSites.length - 1].line + space;
    if (first < 0) {
      first = 0;
    }
    if (last > allLines.length) {
      last = allLines.length;
    }
    let lines = allLines.slice(first - 1, last).map((line, index) => {
      const lineNumber = index + first;
      return {
        line: line,
        number: lineNumber,
        cum: this.callSites.get(lineNumber)?.cum || 0,
        flat: this.callSites.get(lineNumber)?.flat || 0,
      };
    });

    return {
      unit: this.unit,
      lines: lines,
    };
  }

  /**
   * Gets a link to Github for this function.
   */
  LinkToGithub(url: string): string {
    if (url.match(/raw\.githubusercontent\.com\//)) {
      // For raw.githubusercontent.com urls we need to do more massaging to
      // link them to the corresponding github repo.
      //
      // These urls look like: https://raw.githubusercontent.com/golang/go/master/src/runtime/netpoll_kqueue.go
      //
      // We need to transform them to be https://github.com/{org}/{repo}/blob/{filepath}

      // First, remove the wrong domain.
      url = url.replace('https://raw.githubusercontent.com/', '');

      // Next, find the index of the '/' that separates the org/repo from the
      // rest of the url.
      const idx = url.indexOf('/', url.indexOf('/') + 1);

      // Peel off the org and repo.
      const [org, repo] = url.substring(0, idx).split('/');

      // Grab the remainder of the url.
      const rest = url.substring(idx + 1);

      url = `https://github.com/${org}/${repo}/blob/${rest}`;
    }

    // Link to the specific line this function exists at.
    url += `#L${this.startLine}`;

    return url;
  }
}

export type CallSite = {
  line: number;
  flat: number;
  cum: number;
};

export function parsePprof(fnName: string, profile: PprofProfile): FunctionDetails[] {
  const versions = new Map<string, FunctionDetails>();

  profile.sample.forEach((sample) => {
    sample.locationId.forEach((locationId, index) => {
      const location = profile.location.find((loc) => loc.id === locationId);
      if (!location) {
        return;
      }

      const func = profile.function.find((f) => f.id === location.line[0].functionId);
      if (!func) {
        return;
      }

      if (profile.stringTable[Number(func.name)] === fnName) {
        let details = versions.get(location.mappingId);
        if (!details) {
          const mapping = profile.mapping.find((m) => m.id === location.mappingId);
          if (!mapping) {
            return;
          }

          details = new FunctionDetails(
            fnName,
            profile.stringTable[Number(mapping.buildId)],
            Number(func.startLine),
            profile.stringTable[Number(func.filename)],
            new Map<number, CallSite>(),
            profile.stringTable[Number(profile.sampleType[0].unit)]
          );
        }

        const lineNumber = Number(location.line[0].line);
        if (!details.callSites.has(lineNumber)) {
          details.callSites.set(lineNumber, {
            line: Number(location.line[0].line),
            flat: 0,
            cum: 0,
          });
        }
        const callSite = details.callSites.get(lineNumber) as CallSite;

        callSite.cum += Number(sample.value[0]);
        if (index === 0) {
          callSite.flat += Number(sample.value[0]);
        }

        versions.set(location.mappingId, details);
      }
    });
  });

  return Array.from(versions.values());
}

export function getGithubOAuthToken(): string | undefined {
  const cookie = document.cookie
    .split(';')
    .map((cookie) => {
      cookie = cookie.trim();
      let [name, value] = cookie.split('=');
      return { name: name.trim(), value: value.trim() };
    })
    .find(({ name }) => name === 'GitSession');

  if (!cookie) {
    return undefined;
  }
  return cookie.value;
}

export async function loginToGithub(): Promise<void> {
  const client = vcsClient;

  const clientID = await client.githubApp();

  const url = new URL('/login/oauth/authorize', 'https://github.com');
  url.searchParams.set('client_id', clientID);
  url.searchParams.set('redirect_uri', window.location.origin + '/a/grafana-pyroscope-app/github');
  url.searchParams.set('scope', 'repo');

  window.open(url.toString(), 'Github Login', 'width=800,height=600');
  window.addEventListener('message', async (event) => {
    if (event.origin !== window.location.origin) {
      return;
    }

    if (event.data.type !== 'github') {
      return;
    }
    const res = await client.githubLogin(event.data.authCode);
    document.cookie = res.cookie + '; path=/'; // TODO(bryan) probably shouldn't use this path.
  });
}
