// Labels may be rendered in uppercase, and pasted names can contain extra spaces.
// Keep accents and every name component significant; only normalize presentation.
export function matchesRecordDeletionName(input: string, firstName: string, lastName: string): boolean {
  const normalize = (value: string) => value.normalize("NFC").trim().replace(/\s+/gu, " ").toLocaleLowerCase("sr-RS");
  const expected = normalize(`${firstName} ${lastName}`);
  return expected.length > 0 && normalize(input) === expected;
}
