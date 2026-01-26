const PROVIDER_LOGOS: Record<string, string> = {
  'First National Bank': '🏦',
  'Metro Credit Union': '🏢',
  'Digital Finance Co.': '💳',
  'Summit Trust': '🏛️',
  'Harborline Bank': '💼',
};

export const getProviderLogo = (provider?: string) => {
  if (!provider) return '🏦';
  return PROVIDER_LOGOS[provider] ?? '🏦';
};

export const getProviderId = (provider: string) =>
  provider
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
