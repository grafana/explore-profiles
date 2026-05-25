const ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

/** Short random string for React keys and ephemeral client-side IDs. */
export function randomId(size: number): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  let id = '';
  for (let i = 0; i < size; i++) {
    id += ID_ALPHABET[bytes[i]! % ID_ALPHABET.length]!;
  }
  return id;
}
