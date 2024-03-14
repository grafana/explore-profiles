export function generateNonce(): string {
  // https://stackoverflow.com/questions/76825670/how-to-generate-and-use-random-value-for-nonce-in-inline-script-in-javascript
  return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))));
}
