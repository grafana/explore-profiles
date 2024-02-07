/**
 * Returns a pair of [service, profileType]
 */
export function getDefaultServiceAndProfileType(allProfileTypes: any[]): [string, string] {
  return (
    // CPU
    allProfileTypes.find(([, id]) => id.split(':')[1] === 'cpu') ||
    // Java
    allProfileTypes.find(([, id]) => id.split(':')[1] === '.itimer') ||
    // Fallback to first
    allProfileTypes[0]
  );
}
