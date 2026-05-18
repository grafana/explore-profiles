import { saveProfileJsonToFile } from '../saveProfileJsonToFile';

jest.mock('file-saver', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const saveAsMock = jest.requireMock<{ default: jest.Mock }>('file-saver').default;

describe('saveProfileJsonToFile', () => {
  beforeEach(() => {
    saveAsMock.mockClear();
  });

  it('calls saveAs with a UTF-8 JSON blob and the given filename', async () => {
    const profile = { version: 1, nested: { label: 'café' } };
    saveProfileJsonToFile(profile, 'profile-export.json');

    expect(saveAsMock).toHaveBeenCalledTimes(1);
    const [blob, filename] = saveAsMock.mock.calls[0] as [Blob, string];

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
    expect(saveAsMock).not.toHaveBeenCalled();
  });
});
