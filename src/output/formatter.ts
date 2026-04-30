import { getTopPersistentCookies } from '../analysis/cookieRanking';
import { CookieDTO, ScanResult, RiskResult, LegalComplianceResult } from '../types';

function section(title: string) {
  console.log(`\n${title}`);
  console.log('─'.repeat(title.length));
}

function kv(label: string, value: string | number) {
  const padded = label.padEnd(30, ' ');
  console.log(`${padded}: ${value}`);
}

function severityIcon(level: string) {
  if (level === 'high') return '🔴';
  if (level === 'medium') return '🟠';
  return '🟡';
}

function countBy<T extends string>(
  items: CookieDTO[],
  selector: (item: CookieDTO) => T | undefined
): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = selector(item) ?? 'unknown';
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function printCounts(counts: Record<string, number>) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    console.log('  • (none)');
    return;
  }

  entries.forEach(([key, value]) => {
    console.log(`  • ${key.padEnd(24)} ${value}`);
  });
}

function printCookieList(cookies: CookieDTO[], limit = 10) {
  if (cookies.length === 0) {
    console.log('  • (none)');
    return;
  }

  cookies.slice(0, limit).forEach(cookie => {
    const party = cookie.firstParty ? '1P' : '3P';
    const source = cookie.classificationSource ?? 'unknown';
    const confidence = cookie.classificationConfidence ?? 'low';

    console.log(
      `  • ${cookie.name.padEnd(24)} ${cookie.category.padEnd(14)} ${party} ${source}/${confidence}`
    );

    if (cookie.vendor && cookie.vendor !== 'Unknown') {
      console.log(`    Vendor : ${cookie.vendor}`);
    }

    if (cookie.service) {
      console.log(`    Service: ${cookie.service}`);
    }
  });

  if (cookies.length > limit) {
    console.log(`  … and ${cookies.length - limit} more`);
  }
}

export function printReport(result: ScanResult, risk: RiskResult, compliance?: LegalComplianceResult) {
  const afterCookies = result.after.cookies;
  const thirdPartyCookies = afterCookies.filter(c => !c.firstParty);
  const analyticsCookies = afterCookies.filter(c => c.category === 'analytics');
  const advertisingCookies = afterCookies.filter(c => c.category === 'advertisement');
  const unknownCookies = afterCookies.filter(c => c.category === 'other' || c.classificationSource === 'unknown');

  console.log('\n🍪 Cookie Audit Report');
  console.log('='.repeat(26));

  section('📊 Summary');

  kv('Cookies (before)', result.before.cookies.length);
  kv('Cookies (after)', result.after.cookies.length);
  kv('New cookies', result.newCookies.length);
  kv('First-party cookies', afterCookies.length - thirdPartyCookies.length);
  kv('Third-party cookies', thirdPartyCookies.length);
  kv('Trackers (before)', result.beforeTrackers.length);
  kv('Trackers (after)', result.afterTrackers.length);
  kv('LocalStorage keys', Object.keys(result.after.localStorage).length);
  kv('SessionStorage keys', Object.keys(result.after.sessionStorage).length);

  section('🧠 Consent / Analysis');

  kv('Visible consent UI', result.hasVisibleConsentUI ? 'Yes' : 'No');
  kv('Hidden consent markup', result.hasHiddenConsentMarkup ? 'Yes' : 'No');
  kv('Consent clicked', result.consentClicked ? 'Yes' : 'No');
  kv('Classification', result.consentClassification);

  section('🍪 Cookie Categories');
  printCounts(countBy(afterCookies, c => c.category));

  section('🧪 Classification Quality');
  printCounts(countBy(afterCookies, c => c.classificationSource));

  const topCookies = getTopPersistentCookies(afterCookies);

  if (topCookies.length > 0) {
    section('⏳ Top Persistent Cookies');

    topCookies.forEach(c => {
      console.log(`  • ${c.name.padEnd(24)} → ${c.days} days`);
    });
  }

  section('⚖️ Legal Basis');

  printCounts(countBy(afterCookies, c => c.legalBasis));

  const consentRequired = afterCookies.filter(c => c.legalBasis === 'consent');
  const unknownLegal = afterCookies.filter(c => c.legalBasis === 'unknown');

  if (consentRequired.length > 0) {
    console.log(`\n  ⚠️ ${consentRequired.length} cookies likely require consent`);
  }

  if (unknownLegal.length > 0) {
    console.log(`  ❓ ${unknownLegal.length} cookies with unknown legal basis`);
  }

  section('🎯 Advertising Cookies');
  printCookieList(advertisingCookies, 10);

  section('📈 Analytics Cookies');
  printCookieList(analyticsCookies, 10);

  section('❓ Unknown / Other Cookies');
  printCookieList(unknownCookies, 10);

  section('🏢 Vendors');

  if (!result.hasVisibleConsentUI) {
    if (result.vendors.before.length === 0) {
      console.log('  • No vendors detected');
    } else {
      result.vendors.before.forEach(v => {
        console.log(`  • ${v.name.padEnd(15)} ${v.requests} requests`);
      });
    }
  } else {
    console.log('\n  BEFORE consent');
    if (result.vendors.before.length === 0) {
      console.log('  • (none)');
    } else {
      result.vendors.before.forEach(v => {
        console.log(`  • ${v.name.padEnd(15)} ${v.requests} requests`);
      });
    }

    console.log('\n  AFTER consent');
    if (result.vendors.after.length === 0) {
      console.log('  • (none)');
    } else {
      result.vendors.after.forEach(v => {
        console.log(`  • ${v.name.padEnd(15)} ${v.requests} requests`);
      });
    }

    if (result.vendors.new.length > 0) {
      console.log('\n  AFTER-only vendors');
      result.vendors.new.forEach(v => {
        console.log(`  • ${v.name}`);
      });
    }
  }

  section('🚨 Findings');

  const consentRequiredBefore = result.before.cookies.filter(
    c => c.legalBasis === 'consent'
  );

  if (result.consentClassification === 'good') {
    console.log('  ✅ Consent flow looks good');
    console.log('  📊 No tracking vendors detected before visible consent');

    if (consentRequired.length > 0) {
      console.log('  ⚠️ Some cookies require consent but were properly gated');
    }

  } else if (result.consentClassification === 'tracking-before-consent') {
    console.log('  ⚠️ Visible consent UI exists, but trackers load before consent');
    console.log('  📊 Consent mechanism appears ineffective');

  } else if (result.consentClassification === 'non-compliant') {
    console.log('  🔴 Tracking detected without a visible consent mechanism');
    console.log('  📊 Site likely violates consent requirements');

  } else if (result.consentClassification === 'functional-only') {
    console.log('  🟡 Cookies detected, but no tracking technologies found');
    console.log('  📊 Likely functional or essential cookies only');

  } else {
    console.log('  ✅ No cookies or tracking technologies detected');
  }

  if (consentRequiredBefore.length > 0) {
    console.log(
      `  🔴 ${consentRequiredBefore.length} consent-required cookies set BEFORE consent`
    );
  }

  section('📜 Compliance Summary');

  if (result.consentClassification === 'good') {
    console.log('  ✅ Likely compliant with consent requirements');
  } else if (result.consentClassification === 'tracking-before-consent') {
    console.log('  ⚠️ Potential non-compliance (consent not enforced)');
  } else if (result.consentClassification === 'non-compliant') {
    console.log('  🔴 High risk of non-compliance');
  } else if (result.consentClassification === 'functional-only') {
    console.log('  🟡 Likely compliant (no tracking detected)');
  } else {
    console.log('  ✅ No privacy-relevant activity detected');
  }

  if (compliance) {
    section('⚖️ Legal Compliance');

    kv('Score', `${compliance.score} (${compliance.level})`);
    kv(
      'Consent relevant activity',
      compliance.consentRelevantActivity ? 'Yes' : 'No'
    );

    if (compliance.reasons.length > 0) {
      console.log('\n  Reasons:');
      compliance.reasons.forEach(reason => {
        console.log(`  • ${reason}`);
      });
    }
  }

  section('🧮 Risk');

  const icon = severityIcon(risk.level);
  kv('Score', `${risk.score} (${risk.level}) ${icon}`);

  if (risk.issues.length > 0) {
    console.log('\n  Issues:');
    risk.issues.forEach(issue => {
      console.log(`  ${severityIcon(issue.severity)} ${issue.message}`);
    });
  } else {
    console.log('  ✅ No issues detected');
  }

  console.log('\n');
}