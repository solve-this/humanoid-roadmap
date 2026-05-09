export type Locale = 'en' | 'de'

export function localeTag(locale: Locale): string {
  return locale === 'de' ? 'de-DE' : 'en-US'
}
