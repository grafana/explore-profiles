export function cleanupDotResponse(profile: string): string {
  return profile
    .replace(/fontsize=\d+ /g, '')
    .replace(/id="node\d+" /g, '')
    .replace(/labeltooltip=".*\)" /g, '')
    .replace(/tooltip=".*\)" /g, '')
    .replace(/(N\d+ -> N\d+).*/g, '$1')
    .replace(/N\d+ \[label="other.*\n/, '')
    .replace(/shape=box /g, '')
    .replace(/fillcolor="#\w{6}"/g, '')
    .replace(/color="#\w{6}" /g, '');
}
