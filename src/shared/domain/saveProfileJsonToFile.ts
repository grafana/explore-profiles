import saveAs from 'file-saver';

/**
 * Writes a profile object to a JSON download via Blob (avoids data-URL size limits).
 * May throw if `JSON.stringify` fails (e.g. circular structure).
 */
export function saveProfileJsonToFile(profile: unknown, filename: string): void {
  const json = JSON.stringify(profile);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  saveAs(blob, filename);
}
