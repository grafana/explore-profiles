import { loadResources } from '../loadResources';

describe('loadResources', () => {
  it('should load en-US resources', async () => {
    const result = await loadResources('en-US');
    expect(result).toBeDefined();
  });

  it('should load es-ES resources', async () => {
    const result = await loadResources('es-ES');
    expect(result).toBeDefined();
  });

  it('should fallback to en-US for unknown locale', async () => {
    const result = await loadResources('xx-XX');
    expect(result).toBeDefined();
  });

  it('should fallback to en-US for empty string', async () => {
    const result = await loadResources('');
    expect(result).toBeDefined();
  });
});
