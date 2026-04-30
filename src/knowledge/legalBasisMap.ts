import { CookieCategory, LegalBasis } from '../types';

export function mapLegalBasis(category: CookieCategory): LegalBasis {
  switch (category) {
    case 'necessary':
      return 'contract';

    case 'functional':
      return 'legitimate-interest';

    case 'analytics':
      return 'consent';

    case 'advertisement':
      return 'consent';

    case 'security':
      return 'legitimate-interest';

    case 'other':
    default:
      return 'unknown';
  }
}