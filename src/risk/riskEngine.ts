import { ScanResult, RiskResult, RiskIssue, CookieDTO } from '../types';

function getRiskLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 30) return 'low';
  if (score < 70) return 'medium';
  return 'high';
}

export function computeRisk(input: ScanResult): RiskResult {
  const issues: RiskIssue[] = [];
  let score = 0;

  const before = input.before.cookies;
  const after = input.after.cookies;

  const hasPreConsentTracking = before.some(
    (c: CookieDTO) =>
      c.category === 'analytics' || c.category === 'advertisement'
  );

  const hasThirdParty = after.some((c: CookieDTO) => !c.firstParty);

  // 🔥 CASO 1: NO hay consentimiento
  if (!input.hasConsentUI) {
    if (input.beforeTrackers.length > 0) {
      issues.push({
        code: 'NO_CONSENT_MECHANISM',
        message: 'No consent mechanism detected but tracking is present',
        severity: 'high'
      });
      score += 50; // 👈 unificado (evita doble conteo)
    }
  } else {
    // 🔥 CASO 2: hay consentimiento, pero mal implementado
    if (hasPreConsentTracking) {
      issues.push({
        code: 'TRACKING_BEFORE_CONSENT',
        message: 'Tracking cookies detected before consent',
        severity: 'high'
      });
      score += 40;
    }
  }

  if (hasThirdParty) {
    issues.push({
      code: 'THIRD_PARTY_COOKIES',
      message: 'Third-party cookies detected',
      severity: 'medium'
    });
    score += 20;
  }

  if (input.afterTrackers.length > 0) {
    issues.push({
      code: 'TRACKERS_DETECTED',
      message: 'Tracking requests detected',
      severity: 'medium'
    });
    score += 20;
  }

  if (Object.keys(input.after.localStorage).length > 0) {
    issues.push({
      code: 'LOCAL_STORAGE_USED',
      message: 'Local storage detected (potential tracking)',
      severity: 'low'
    });
    score += 10;
  }

  return {
    score: Math.min(score, 100),
    level: getRiskLevel(score),
    issues
  };
}