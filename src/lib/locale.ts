export interface CountryDefaults {
  countryCode: string;
  currencyCode: string;
  currencySymbol: string;
  exchangeRateFromUsd: number;
  electricityCostPerKwh: number;
}

export const COUNTRY_DEFAULTS: Record<string, CountryDefaults> = {
  US: { countryCode: 'US', currencyCode: 'USD', currencySymbol: '$', exchangeRateFromUsd: 1, electricityCostPerKwh: 0.16 },
  MX: { countryCode: 'MX', currencyCode: 'MXN', currencySymbol: '$', exchangeRateFromUsd: 18.2, electricityCostPerKwh: 0.08 },
  GB: { countryCode: 'GB', currencyCode: 'GBP', currencySymbol: 'GBP ', exchangeRateFromUsd: 0.79, electricityCostPerKwh: 0.40 },
  DE: { countryCode: 'DE', currencyCode: 'EUR', currencySymbol: 'EUR ', exchangeRateFromUsd: 0.92, electricityCostPerKwh: 0.40 },
  FR: { countryCode: 'FR', currencyCode: 'EUR', currencySymbol: 'EUR ', exchangeRateFromUsd: 0.92, electricityCostPerKwh: 0.28 },
  ES: { countryCode: 'ES', currencyCode: 'EUR', currencySymbol: 'EUR ', exchangeRateFromUsd: 0.92, electricityCostPerKwh: 0.25 },
  IT: { countryCode: 'IT', currencyCode: 'EUR', currencySymbol: 'EUR ', exchangeRateFromUsd: 0.92, electricityCostPerKwh: 0.35 },
  AR: { countryCode: 'AR', currencyCode: 'ARS', currencySymbol: '$', exchangeRateFromUsd: 930, electricityCostPerKwh: 0.05 },
  CO: { countryCode: 'CO', currencyCode: 'COP', currencySymbol: '$', exchangeRateFromUsd: 3900, electricityCostPerKwh: 0.15 },
  CL: { countryCode: 'CL', currencyCode: 'CLP', currencySymbol: '$', exchangeRateFromUsd: 930, electricityCostPerKwh: 0.18 },
  PE: { countryCode: 'PE', currencyCode: 'PEN', currencySymbol: 'S/', exchangeRateFromUsd: 3.75, electricityCostPerKwh: 0.18 },
  BR: { countryCode: 'BR', currencyCode: 'BRL', currencySymbol: 'R$', exchangeRateFromUsd: 5.15, electricityCostPerKwh: 0.17 },
  UY: { countryCode: 'UY', currencyCode: 'UYU', currencySymbol: '$U', exchangeRateFromUsd: 39, electricityCostPerKwh: 0.22 },
  CR: { countryCode: 'CR', currencyCode: 'CRC', currencySymbol: 'CRC ', exchangeRateFromUsd: 520, electricityCostPerKwh: 0.15 },
  DO: { countryCode: 'DO', currencyCode: 'DOP', currencySymbol: 'RD$', exchangeRateFromUsd: 59, electricityCostPerKwh: 0.20 },
  PA: { countryCode: 'PA', currencyCode: 'USD', currencySymbol: '$', exchangeRateFromUsd: 1, electricityCostPerKwh: 0.18 },
  SV: { countryCode: 'SV', currencyCode: 'USD', currencySymbol: '$', exchangeRateFromUsd: 1, electricityCostPerKwh: 0.18 },
  EC: { countryCode: 'EC', currencyCode: 'USD', currencySymbol: '$', exchangeRateFromUsd: 1, electricityCostPerKwh: 0.10 },
};

export const CURRENCY_OPTIONS = Array.from(
  new Map(Object.values(COUNTRY_DEFAULTS).map((entry) => [entry.currencyCode, entry])).values(),
).sort((a, b) => a.currencyCode.localeCompare(b.currencyCode));

export const DEFAULT_COUNTRY = COUNTRY_DEFAULTS.US;

export function getCountryDefaults(countryCode?: string): CountryDefaults {
  return countryCode ? COUNTRY_DEFAULTS[countryCode] ?? DEFAULT_COUNTRY : DEFAULT_COUNTRY;
}

export async function detectCountryDefaults(): Promise<CountryDefaults> {
  const response = await fetch('https://get.geojs.io/v1/ip/country.json');
  const data = await response.json();
  return getCountryDefaults(data.country);
}