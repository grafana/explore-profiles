const collator = new Intl.Collator('en', { sensitivity: 'case' });

export const localeCompare = collator.compare;
