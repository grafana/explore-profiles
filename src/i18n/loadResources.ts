import { type ResourceLoader } from '@grafana/i18n';

export const loadResources: ResourceLoader = async (language: string) => {
  const fallbackLanguage = 'en-US';
  const locale = language || fallbackLanguage;

  if (locale === fallbackLanguage) {
    return {};
  }

  try {
    return await import(`../locales/${locale}/grafana-pyroscope-app.json`);
  } catch (error) {
    if (locale !== fallbackLanguage) {
      return await import(`../locales/${fallbackLanguage}/grafana-pyroscope-app.json`);
    }
    throw error;
  }
};
