export function getCommonProfileCategoryAndName(profileType = ':') {
  const [category, name] = profileType.split(':', 2);
  return { category, name };
}
