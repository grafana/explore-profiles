export function invariant(check: boolean, message: string): asserts check {
  if (!check) {
    throw new Error(message);
  }
}
