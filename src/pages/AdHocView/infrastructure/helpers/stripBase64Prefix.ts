export function stripBase64Prefix(fileContent: string): string {
  const [, base64Content] = fileContent.split(';base64,');

  if (!base64Content) {
    throw new Error('No content after stripping the base64 prefix.');
  }

  if (fileContent === base64Content) {
    throw new Error('No base64 prefix?!');
  }

  return base64Content;
}
