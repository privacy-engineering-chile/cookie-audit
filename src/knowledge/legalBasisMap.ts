import { CookieCategory, LegalBasis } from '../types';

export function mapLegalBasis(input: {
  category: CookieCategory;
  name: string;
}): LegalBasis {
  const name = input.name.toLowerCase();

  if (input.category === 'advertisement') return 'consent';
  if (input.category === 'analytics') return 'consent';

  if (
    name.includes('cart') ||
    name.includes('checkout') ||
    name.includes('order') ||
    name.includes('purchase')
  ) {
    return 'contract';
  }

  if (
    name.includes('auth') ||
    name.includes('login') ||
    name.includes('csrf') ||
    name.includes('xsrf') ||
    name.includes('token') ||
    name.includes('session') ||
    name.includes('sid') ||
    input.category === 'necessary' ||
    input.category === 'security' ||
    input.category === 'functional'
  ) {
    return 'legitimate-interest';
  }

  return 'unknown';
}