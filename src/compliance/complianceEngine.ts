import { LegalComplianceResult, ScanResult } from '../types';

function getLevel(score: number): LegalComplianceResult['level'] {
  if (score >= 85) return 'likely-compliant';
  if (score >= 65) return 'moderate-concern';
  if (score >= 40) return 'high-concern';
  return 'severe-concern';
}

function scoreUnknownRatio(unknown: number, total: number): number {
  if (total === 0) return 10;

  const ratio = unknown / total;

  if (ratio === 0) return 10;
  if (ratio <= 0.2) return 5;

  return 0;
}

export function computeLegalCompliance(
  result: ScanResult
): LegalComplianceResult {
  const beforeCookies = result.before.cookies;
  const afterCookies = result.after.cookies;

  const allCookies = afterCookies;
  const totalCookies = allCookies.length;

  const consentRequiredBefore = beforeCookies.filter(
    c => c.legalBasis === 'consent'
  );

  const consentRequiredAfter = afterCookies.filter(
    c => c.legalBasis === 'consent'
  );

  const unknownClassification = allCookies.filter(
    c => c.classificationSource === 'unknown'
  );

  const unknownLegalBasis = allCookies.filter(
    c => c.legalBasis === 'unknown'
  );

  const hasConsentRelevantActivity =
    consentRequiredAfter.length > 0 ||
    result.beforeTrackers.length > 0 ||
    result.afterTrackers.length > 0;

  const reasons: string[] = [];

  if (!hasConsentRelevantActivity) {
    return {
      score: 100,
      level: 'likely-compliant',
      consentRelevantActivity: false,
      reasons: ['No consent-required cookies or tracking requests detected']
    };
  }

  let score = 0;

  // 1. Consent mechanism — 25 pts
  if (result.hasVisibleConsentUI) {
    score += 25;
    reasons.push('Visible consent mechanism detected');
  } else if (result.hasHiddenConsentMarkup) {
    score += 10;
    reasons.push('Only hidden consent markup detected');
  } else {
    reasons.push('No visible consent mechanism detected');
  }

  // 2. Consent-required cookies before consent — 30 pts
  if (consentRequiredBefore.length === 0) {
    score += 30;
    reasons.push('No consent-required cookies set before consent');
  } else if (consentRequiredBefore.length <= 2) {
    score += 15;
    reasons.push(
      `${consentRequiredBefore.length} consent-required cookies set before consent`
    );
  } else {
    reasons.push(
      `${consentRequiredBefore.length} consent-required cookies set before consent`
    );
  }

  // 3. Tracking requests before consent — 20 pts
  if (result.beforeTrackers.length === 0) {
    score += 20;
    reasons.push('No tracking requests before consent');
  } else if (result.beforeTrackers.length <= 5) {
    score += 10;
    reasons.push(`${result.beforeTrackers.length} tracking requests before consent`);
  } else {
    reasons.push(`${result.beforeTrackers.length} tracking requests before consent`);
  }

  // 4. Classification certainty — 10 pts
  const classificationScore = scoreUnknownRatio(
    unknownClassification.length,
    totalCookies
  );
  score += classificationScore;

  if (unknownClassification.length > 0) {
    reasons.push(`${unknownClassification.length} cookies could not be classified`);
  } else {
    reasons.push('All cookies classified');
  }

  // 5. Legal-basis certainty — 10 pts
  const legalBasisScore = scoreUnknownRatio(
    unknownLegalBasis.length,
    totalCookies
  );
  score += legalBasisScore;

  if (unknownLegalBasis.length > 0) {
    reasons.push(`${unknownLegalBasis.length} cookies have unknown legal basis`);
  } else {
    reasons.push('All cookies mapped to a legal basis');
  }

  // 6. Consent effectiveness — 5 pts
  if (result.hasVisibleConsentUI && result.consentClicked) {
    score += 5;
    reasons.push('Consent interaction was captured');
  } else {
    reasons.push('Consent interaction was not captured');
  }

  return {
    score,
    level: getLevel(score),
    consentRelevantActivity: true,
    reasons
  };
}