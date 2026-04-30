import { v4 as uuidv4 } from 'uuid';
import { LegalComplianceResult, ScanResult, RiskResult } from '../types';
import { getTopPersistentCookies } from '../analysis/cookieRanking';

type BuildJsonInput = {
  url: string;
  durationMs: number;
  result: ScanResult;
  risk: RiskResult;
  compliance?: LegalComplianceResult;
};

function countBy<T>(items: T[], selector: (item: T) => string | undefined) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = selector(item) ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function buildJsonOutput(input: BuildJsonInput) {
  const now = new Date();
  const { result, risk } = input;

  const analysisMode = result.hasVisibleConsentUI
    ? 'before-after-consent'
    : 'passive';

  let consentNote = 'No consent mechanism detected';

  if (result.hasVisibleConsentUI) {
    consentNote = result.consentClicked
      ? 'Visible consent UI detected and clicked'
      : 'Visible consent UI detected but not clicked';
  } else if (result.hasHiddenConsentMarkup) {
    consentNote = 'Hidden consent markup detected, but no visible banner';
  }

  return {
    meta: {
      url: input.url,
      scanId: uuidv4(),
      timestamp: now.toISOString(),
      version: '0.3.0',
      durationMs: input.durationMs
    },

    analysis: {
      mode: analysisMode,
      hasConsentUI: result.hasVisibleConsentUI,
      hasVisibleConsentUI: result.hasVisibleConsentUI,
      hasHiddenConsentMarkup: result.hasHiddenConsentMarkup,
      consentClicked: result.consentClicked,
      consentClassification: result.consentClassification
    },

    summary: {
      cookies: {
        before: result.before.cookies.length,
        after: result.after.cookies.length,
        new: result.newCookies.length,
        firstParty: result.after.cookies.filter(c => c.firstParty).length,
        thirdParty: result.after.cookies.filter(c => !c.firstParty).length,
        byCategory: countBy(result.after.cookies, c => c.category),
        byLegalBasis: countBy(result.after.cookies, c => c.legalBasis),
        byClassificationSource: countBy(
          result.after.cookies,
          c => c.classificationSource
        ),
        byClassificationConfidence: countBy(
          result.after.cookies,
          c => c.classificationConfidence
        ),
        consentRequired: result.after.cookies.filter(
          c => c.legalBasis === 'consent'
        ).length,
        unknownLegalBasis: result.after.cookies.filter(
          c => c.legalBasis === 'unknown'
        ).length
      },
      trackers: {
        before: result.beforeTrackers.length,
        after: result.afterTrackers.length
      },
      vendors: {
        before: result.vendors.before.length,
        after: result.vendors.after.length,
        new: result.vendors.new.length
      }
    },

    cookies: {
      before: result.before.cookies,
      after: result.after.cookies,
      new: result.newCookies,
      topPersistent: getTopPersistentCookies(result.after.cookies)
    },

    storage: {
      before: {
        localStorage: result.before.localStorage,
        sessionStorage: result.before.sessionStorage
      },
      after: {
        localStorage: result.after.localStorage,
        sessionStorage: result.after.sessionStorage
      }
    },

    trackers: {
      before: result.beforeTrackers,
      after: result.afterTrackers
    },

    vendors: {
      before: result.vendors.before,
      after: result.vendors.after,
      new: result.vendors.new
    },

    consent: {
      detected: result.hasVisibleConsentUI,
      visible: result.hasVisibleConsentUI,
      hiddenMarkup: result.hasHiddenConsentMarkup,
      clicked: result.consentClicked,
      classification: result.consentClassification,
      mode: analysisMode,
      note: consentNote
    },

    risk,
    compliance: input.compliance ?? null,
  };
}