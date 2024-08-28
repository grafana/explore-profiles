// when using direction=rtl, the first / is ending up at the end of the string
// so we add a / at the end of the string to make it look better
export const formatFileName = (fileName: string): string =>
  fileName?.[0] === '/' ? fileName.substring(1) + '/' : fileName;
