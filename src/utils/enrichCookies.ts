import { classifyCookie } from '../knowledge/classifyCookie';
import { Cookie, CookieDTO } from '../types';
import { getBaseDomain, isFirstParty } from './domain';
import { mapLegalBasis } from '../knowledge/legalBasisMap';

export function enrichCookies(cookies: Cookie[], url: string): CookieDTO[] {
  const baseDomain = getBaseDomain(url);

  return cookies.map(cookie => {
    const classification = classifyCookie({
      name: cookie.name,
      domain: cookie.domain,
      expires: cookie.expires,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure
    });

    const legalBasis = mapLegalBasis({
      category: classification.category,
      name: cookie.name,
    });

    return {
      ...cookie,
      category: classification.category,
      vendor: classification.vendor,
      service: classification.service,
      description: classification.description,
      classificationSource: classification.source,
      classificationConfidence: classification.confidence,
      firstParty: isFirstParty(cookie.domain, baseDomain),
      legalBasis,
    };
  });
}