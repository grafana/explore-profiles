import saveAs from 'file-saver';

import { saveProfileJsonToFile } from '../saveProfileJsonToFile';

/* file-saver `saveAs` is flagged deprecated in typings; still used for downloads. */
/* eslint-disable @typescript-eslint/no-deprecated */

jest.mock('file-saver', () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe('saveProfileJsonToFile', () => {
  beforeEach(() => {
    jest.mocked(saveAs).mockClear();
  });

  it('calls saveAs with a UTF-8 JSON blob and the given filename', async () => {
    const profile = { version: 1, nested: { label: 'café' } };
    saveProfileJsonToFile(profile, 'profile-export.json');

    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blob, filename] = jest.mocked(saveAs).mock.calls[0] as [Blob, string];

    expect(filename).toBe('profile-export.json');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/json;charset=utf-8');

    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(text).toBe(JSON.stringify(profile));
  });

  it('propagates JSON.stringify errors (e.g. circular structure)', () => {
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    expect(() => saveProfileJsonToFile(circular, 'bad.json')).toThrow();
    expect(saveAs).not.toHaveBeenCalled();
  });
});
