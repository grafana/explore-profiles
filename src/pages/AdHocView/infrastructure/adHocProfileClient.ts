import { config } from '@grafana/runtime';

import { HttpClient } from '../../../shared/infrastructure/HttpClient';
import { Profile } from '../domain/Profile';
import { stripBase64Prefix } from './helpers/stripBase64Prefix';

class AdHocProfileClient extends HttpClient {
  constructor() {
    let { appUrl } = config;

    if (appUrl.at(-1) !== '/') {
      // to ensure that the API pathname is appended correctly (appUrl seems to always have it but better to be extra careful)
      appUrl += '/';
    }

    const apiBaseUrl = new URL(
      'api/plugins/grafana-pyroscope-app/resources/adhocprofiles.v1.AdHocProfileService',
      appUrl
    );

    super(apiBaseUrl.toString(), {
      'content-type': 'application/json',
    });
  }

  async get(profileId: string, profileType: string): Promise<Profile> {
    const response = await this.fetch('/Get', {
      method: 'POST',
      body: JSON.stringify({
        id: profileId,
        profile_type: profileType,
      }),
    });

    const json = await response.json();

    return {
      id: json.id,
      name: json.name,
      profileTypes: json.profileTypes,
      profile: JSON.parse(json.flamebearerProfile),
    };
  }

  async uploadSingle(file: File): Promise<Profile> {
    const profile = await this._readProfile(file);

    const response = await this.fetch('/Upload', {
      method: 'POST',
      body: JSON.stringify({
        name: file.name,
        profile,
      }),
    });

    const json = await response.json();

    return {
      id: json.id,
      name: file.name,
      profileTypes: json.profileTypes,
      // when the uploaded file contains multiple sample types, the 1st is always returned by the API
      profile: JSON.parse(json.flamebearerProfile),
    };
  }

  // TODO
  async uploadDiff() {
    return {
      id: '?',
      name: '??',
      profileTypes: [],
      profile: null,
    };
  }

  async _readProfile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();

      fileReader.addEventListener('load', () => {
        try {
          resolve(stripBase64Prefix(fileReader.result as string));
        } catch (error) {
          reject(error);
        }
      });

      fileReader.addEventListener('error', (/*event: ProgressEvent<FileReader>*/) => {
        // TODO: upgrade TS lib compiler option to support latest JS features
        // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/cause
        reject(new Error(`Error while reading file "${file.name}"!` /*, { cause: event }*/));
      });

      fileReader.readAsDataURL(file);
    });
  }
}
export const adHocProfileClient = new AdHocProfileClient();
