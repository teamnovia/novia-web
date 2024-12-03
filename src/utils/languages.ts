// Define a type for ISO 639-1 Language Codes
export type LanguageCode = 'en' | 'fr' | 'es' | 'de' | 'it' | 'zh' | 'ja' | 'ru' | 'pt' | 'ar';
// Add more language codes as needed

// Define a type for ISO 3166-1 Alpha-2 Country Codes
type CountryCode = 'US' | 'FR' | 'ES' | 'DE' | 'IT' | 'CN' | 'JP' | 'RU' | 'PT' | 'SA';
// Add more country codes as needed

// Mapping from Language Codes to Country Codes
const languageToCountryMap: Record<LanguageCode, CountryCode> = {
  en: 'US', // English -> United States
  fr: 'FR', // French -> France
  es: 'ES', // Spanish -> Spain
  de: 'DE', // German -> Germany
  it: 'IT', // Italian -> Italy
  zh: 'CN', // Chinese -> China
  ja: 'JP', // Japanese -> Japan
  ru: 'RU', // Russian -> Russia
  pt: 'PT', // Portuguese -> Portugal
  ar: 'SA', // Arabic -> Saudi Arabia
  // Add more mappings as needed
};

/**
 * Converts a country code to its corresponding flag emoji.
 * @param countryCode - A two-letter ISO 3166-1 alpha-2 country code.
 * @returns The flag emoji as a string.
 */
function getFlagEmoji(countryCode: CountryCode): string {
  if (!countryCode) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));

  return String.fromCodePoint(...codePoints);
}

/**
 * Retrieves the flag emoji for a given language code.
 * @param languageCode - A two-letter ISO 639-1 language code.
 * @returns The flag emoji as a string, or an empty string if not found.
 */
function getLanguageFlag(languageCode: LanguageCode): string {
  const countryCode = languageToCountryMap[languageCode.toLowerCase() as LanguageCode];
  return getFlagEmoji(countryCode);
}

// Export the function for use in other modules
export { getLanguageFlag };
