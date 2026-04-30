import { chromium, Page } from 'playwright';
import { Timeline } from './timeline';
import { detectConsentPresence, handleConsent } from '../detectors/consent';
import { enrichCookies } from '../utils/enrichCookies';
import { getStorage } from '../detectors/storage';
import { applyStealth } from '../utils/stealth';
import { mapVendors, diffVendors } from '../detectors/vendors';
import { isTracker } from '../detectors/isTracker';
import { ScanResult, ConsentClassification } from '../types';


function classifyConsent(input: {
  hasVisibleConsentUI: boolean;
  trackersBefore: number;
  trackersAfter: number;
  cookiesBefore: number;
  cookiesAfter: number;
}): ConsentClassification {
  const hasTrackingBefore = input.trackersBefore > 0;
  const hasTrackingAfter = input.trackersAfter > 0;
  const hasAnyTracking = hasTrackingBefore || hasTrackingAfter;

  const hasCookies =
    input.cookiesBefore > 0 || input.cookiesAfter > 0;

  // 🟢 No cookies, no tracking
  if (!hasAnyTracking && !hasCookies) {
    return 'no-tracking';
  }

  // 🟡 Cookies but no tracking
  if (!hasAnyTracking && hasCookies) {
    return 'functional-only';
  }

  // 🟢 Good consent
  if (input.hasVisibleConsentUI && !hasTrackingBefore) {
    return 'good';
  }

  // 🟠 Tracking before consent
  if (input.hasVisibleConsentUI && hasTrackingBefore) {
    return 'tracking-before-consent';
  }

  // 🔴 No consent + tracking
  return 'non-compliant';
}

async function getAllCookiesFromCDP(page: Page) {
  const client = await page.context().newCDPSession(page);

  try {
    const result = await client.send('Network.getAllCookies');

    return result.cookies.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      expires: cookie.expires ?? -1,
      httpOnly: cookie.httpOnly ?? false,
      secure: cookie.secure ?? false,
      sameSite: cookie.sameSite ?? 'None'
    }));
  } finally {
    await client.detach().catch(() => undefined);
  }
}

export async function scan(url: string): Promise<ScanResult> {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
      locale: 'es-CL',
      timezoneId: 'America/Santiago'
    });

    const page = await context.newPage();
    await applyStealth(page);

    const timeline = new Timeline();
    const setCookieHeaders: string[] = [];

    const beforeTrackers: string[] = [];
    const afterTrackers: string[] = [];

    let phase: 'before' | 'after' = 'before';

    page.on('request', (req) => {
      const requestUrl = req.url();
      const type = req.resourceType();

      if (['image', 'stylesheet', 'font', 'media'].includes(type)) return;
      if (!isTracker(requestUrl)) return;

      if (phase === 'before') beforeTrackers.push(requestUrl);
      else afterTrackers.push(requestUrl);
    });

    page.on('response', (response) => {
      const headers = response.headers();

      if (headers['set-cookie']) {
        setCookieHeaders.push(headers['set-cookie']);
      }
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch {
      console.warn('⚠️ Navigation timeout, continuing...');
    }

    await page.waitForTimeout(4000);

    const consentDetection = await detectConsentPresence(page).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️ Consent detection failed, continuing: ${message}`);

      return {
        hasVisibleConsentUI: false,
        hasHiddenConsentMarkup: false
      };
    });

    const { hasVisibleConsentUI, hasHiddenConsentMarkup } = consentDetection;
    let consentClicked = false;

    const rawBeforeCookies = await getAllCookiesFromCDP(page);
    const beforeCookies = enrichCookies(rawBeforeCookies, url);
    const beforeStorage = await getStorage(page);

    timeline.add({
      label: 'before',
      cookies: beforeCookies,
      timestamp: Date.now()
    });

    if (hasVisibleConsentUI) {
      phase = 'after';

      try {
        consentClicked = await handleConsent(page);

        if (!consentClicked) {
          console.warn('⚠️ Visible consent UI detected, but no button was clicked');
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️ Consent handling failed, continuing scan: ${message}`);
      }

      await page.mouse.move(300, 300).catch(() => undefined);
      await page.mouse.wheel(0, 1500).catch(() => undefined);
      await page.waitForTimeout(1000);

      await page
        .evaluate(() => {
          window.dispatchEvent(new Event('scroll'));
          window.dispatchEvent(new Event('mousemove'));
        })
        .catch(() => undefined);

      await page.waitForTimeout(5000);
      await page
        .waitForLoadState('networkidle', { timeout: 10000 })
        .catch(() => undefined);
      await page.waitForTimeout(3000);
    } else {
        if (hasHiddenConsentMarkup) {
        console.log('ℹ️ Hidden consent markup detected, but no visible banner');
      } else {
        console.log('ℹ️ No consent mechanism detected');
      }
    }

    const rawAfterCookies = await getAllCookiesFromCDP(page);
    const afterCookies = enrichCookies(rawAfterCookies, url);
    const afterStorage = await getStorage(page);

    timeline.add({
      label: 'after',
      cookies: afterCookies,
      timestamp: Date.now()
    });

    const newCookies = timeline.diff();

    const uniqueBeforeTrackers = Array.from(new Set(beforeTrackers));
    const uniqueAfterTrackers = Array.from(new Set(afterTrackers));

    const beforeVendors = mapVendors(uniqueBeforeTrackers);
    const afterVendors = mapVendors(uniqueAfterTrackers);
    const newVendors = diffVendors(beforeVendors, afterVendors);

    const consentClassification = classifyConsent({
      hasVisibleConsentUI,
      trackersBefore: uniqueBeforeTrackers.length,
      trackersAfter: uniqueAfterTrackers.length,
      cookiesBefore: beforeCookies.length,
      cookiesAfter: afterCookies.length
    });

    return {
      before: {
        cookies: beforeCookies,
        setCookieHeaders,
        localStorage: beforeStorage.localStorage,
        sessionStorage: beforeStorage.sessionStorage
      },
      after: {
        cookies: afterCookies,
        setCookieHeaders,
        localStorage: afterStorage.localStorage,
        sessionStorage: afterStorage.sessionStorage
      },
      newCookies,
      beforeTrackers: uniqueBeforeTrackers,
      afterTrackers: uniqueAfterTrackers,
      vendors: {
        before: beforeVendors,
        after: afterVendors,
        new: newVendors
      },
      hasConsentUI: hasVisibleConsentUI,
      hasVisibleConsentUI,
      hasHiddenConsentMarkup,
      consentClicked,
      consentClassification
    };
  } finally {
    await browser.close().catch(() => undefined);
  }
}