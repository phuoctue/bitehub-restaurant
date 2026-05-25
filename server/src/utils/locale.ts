export type ContentLocale = 'vi' | 'en'

export const resolveContentLocale = (headers: Record<string, unknown>): ContentLocale => {
  const explicitLocale = String(headers['x-locale'] || '').toLowerCase()
  if (explicitLocale.startsWith('en')) return 'en'
  if (explicitLocale.startsWith('vi')) return 'vi'

  const acceptLanguage = String(headers['accept-language'] || '').toLowerCase()
  if (acceptLanguage.includes('en')) return 'en'
  return 'vi'
}

export const pickLocalizedText = ({
  locale,
  vi,
  en
}: {
  locale: ContentLocale
  vi: string
  en?: string | null
}) => {
  if (locale === 'en' && en && en.trim()) {
    return en
  }
  return vi
}

