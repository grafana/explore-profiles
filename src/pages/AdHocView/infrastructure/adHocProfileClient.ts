import { ApiClient } from '@shared/infrastructure/http/ApiClient';

import { Profile } from '../domain/Profile';
import { stripBase64Prefix } from './helpers/stripBase64Prefix';

class AdHocProfileClient extends ApiClient {
  async get(profileId: string, profileType: string): Promise<Profile> {
    const response = await this.fetch('/adhocprofiles.v1.AdHocProfileService/Get', {
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
    const profile = await this._readProfileFile(file);

    const response = await this.fetch('/adhocprofiles.v1.AdHocProfileService/Upload', {
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

  async _readProfileFile(file: File): Promise<string> {
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
