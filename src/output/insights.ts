import { ScanResult, CookieDTO } from '../types';

export function generateInsights(result: ScanResult): string[] {
  const insights: string[] = [];

  const after = result.after.cookies;
  const before = result.before.cookies;

  const advertisement = after.filter(
    (c: CookieDTO) => c.category === 'advertisement'
  );

  const analytics = after.filter(
    (c: CookieDTO) => c.category === 'analytics'
  );

  const thirdParty = after.filter(
    (c: CookieDTO) => !c.firstParty
  );

  const consentRequired = after.filter(
    (c: CookieDTO) => c.legalBasis === 'consent'
  );

  const unknownLegalBasis = after.filter(
    (c: CookieDTO) => c.legalBasis === 'unknown'
  );

  const consentRequiredBefore = before.filter(
    (c: CookieDTO) => c.legalBasis === 'consent'
  );

  if (advertisement.length > 0) {
    insights.push(`${advertisement.length} advertisement cookies detected`);
  }

  if (analytics.length > 0) {
    insights.push(`${analytics.length} analytics cookies detected`);
  }

  if (thirdParty.length > 0) {
    insights.push(`${thirdParty.length} third-party cookies detected`);
  }

  if (consentRequired.length > 0) {
    insights.push(`${consentRequired.length} cookies likely require consent`);
  }

  if (unknownLegalBasis.length > 0) {
    insights.push(`${unknownLegalBasis.length} cookies need legal basis review`);
  }

  if (consentRequiredBefore.length > 0) {
    insights.push(
      `${consentRequiredBefore.length} consent-required cookies set before consent ⚠️`
    );
  }

  if (result.beforeTrackers.length > 0) {
    insights.push(
      `${result.beforeTrackers.length} tracking requests detected before consent ⚠️`
    );
  }

  if (result.afterTrackers.length > 0) {
    insights.push(`${result.afterTrackers.length} tracking requests detected`);
  }

  return insights;
}