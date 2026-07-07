import { loadResources } from '../loadResources';

describe('loadResources', () => {
  describe('default language short-circuit', () => {
    it('should return an empty object when language is en-US', async () => {
      const result = await loadResources('en-US');
      expect(result).toEqual({});
    });

    it('should return an empty object when language is empty string', async () => {
      const result = await loadResources('');
      expect(result).toEqual({});
    });
  });

  describe('non-default languages', () => {
    it('should load es-ES resources', async () => {
      const result = await loadResources('es-ES');
      expect(result).toBeDefined();
    });

    it('should fallback to en-US for unknown locale', async () => {
      const result = await loadResources('xx-XX');
      expect(result).toBeDefined();
    });
  });
});
