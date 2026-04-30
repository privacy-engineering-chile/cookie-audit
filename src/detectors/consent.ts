import { Page, Locator } from 'playwright';

export interface ConsentDetectionResult {
  hasVisibleConsentUI: boolean;
  hasHiddenConsentMarkup: boolean;
}

const CONSENT_CONTAINER_SELECTOR = [
  '[class*="cookie" i]',
  '[id*="cookie" i]',
  '[class*="consent" i]',
  '[id*="consent" i]',
  '[class*="policies" i]',
  '#onetrust-banner-sdk',
  '#CybotCookiebotDialog',
  '.didomi-popup'
].join(', ');

const ACCEPT_BUTTON_SELECTOR = [
  'button:has-text("Aceptar")',
  'button:has-text("Aceptar todo")',
  'button:has-text("Aceptar todas")',
  'button:has-text("Aceptar cookies")',
  'button:has-text("Acepto")',
  'button:has-text("Entendido")',
  'button:has-text("De acuerdo")',
  'button:has-text("Continuar")',
  'button:has-text("OK")',
  'button:has-text("Accept")',
  'button:has-text("Accept all")',
  'button:has-text("Allow all")',
  'button:has-text("Agree")',
  'button:has-text("Got it")',
  '[role="button"]:has-text("Aceptar")',
  '[role="button"]:has-text("Aceptar todo")',
  '[role="button"]:has-text("Acepto")',
  '[role="button"]:has-text("Accept")',
  '[role="button"]:has-text("Accept all")',
  '#onetrust-accept-btn-handler',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll',
  '.button-policies-accepted'
].join(', ');

const COOKIE_PHRASES = [
  'usamos cookies',
  'utilizamos cookies',
  'este sitio utiliza cookies',
  'este sitio web utiliza cookies',
  'cookies para mejorar tu experiencia',
  'cookies para mejorar su experiencia',
  'mejorar tu experiencia',
  'mejorar su experiencia',
  'política de cookies',
  'políticas de cookies',
  'politica de cookies',
  'politicas de cookies',
  'política de privacidad',
  'políticas de privacidad',
  'privacy policy',
  'cookie policy',
  'we use cookies',
  'this site uses cookies',
  'we use cookies to improve',
  'cookies to improve your experience'
];

const ACCEPT_ACTIONS = [
  'aceptar',
  'aceptar todo',
  'aceptar todas',
  'aceptar cookies',
  'acepto',
  'permitir',
  'permitir todo',
  'aceptar y continuar',
  'entendido',
  'ok',
  'de acuerdo',
  'continuar',
  'accept',
  'accept all',
  'allow all',
  'agree',
  'got it'
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text: string, patterns: string[]): boolean {
  return patterns.some(pattern => text.includes(normalize(pattern)));
}

async function isReallyVisible(locator: Locator): Promise<boolean> {
  const visible = await locator.isVisible().catch(() => false);
  if (!visible) return false;

  const box = await locator.boundingBox().catch(() => null);
  if (!box || box.width === 0 || box.height === 0) return false;

  return true;
}

async function containerLooksLikeConsent(container: Locator): Promise<boolean> {
  const rawText = await container.innerText({ timeout: 1000 }).catch(() => '');
  const text = normalize(rawText);

  const hasCookieLanguage = includesAny(text, COOKIE_PHRASES);
  const hasAcceptAction = includesAny(text, ACCEPT_ACTIONS);

  if (hasCookieLanguage && hasAcceptAction) return true;

  if (hasCookieLanguage && text.length < 700) return true;

  return false;
}

export async function detectConsentPresence(
  page: Page
): Promise<ConsentDetectionResult> {
  let hasHiddenConsentMarkup = false;

  const containers = page.locator(CONSENT_CONTAINER_SELECTOR);
  const count = await containers.count().catch(() => 0);

  for (let i = 0; i < count; i++) {
    const container = containers.nth(i);

    const looksLikeConsent = await containerLooksLikeConsent(container);
    if (!looksLikeConsent) continue;

    const visible = await isReallyVisible(container);

    if (visible) {
      return {
        hasVisibleConsentUI: true,
        hasHiddenConsentMarkup
      };
    }

    hasHiddenConsentMarkup = true;
  }

  return {
    hasVisibleConsentUI: false,
    hasHiddenConsentMarkup
  };
}

export async function handleConsent(page: Page): Promise<boolean> {
  const containers = page.locator(CONSENT_CONTAINER_SELECTOR);
  const count = await containers.count().catch(() => 0);

  for (let i = 0; i < count; i++) {
    const container = containers.nth(i);

    const looksLikeConsent = await containerLooksLikeConsent(container);
    if (!looksLikeConsent) continue;

    const containerVisible = await isReallyVisible(container);
    if (!containerVisible) continue;

    const button = container.locator(ACCEPT_BUTTON_SELECTOR).first();

    const buttonCount = await button.count().catch(() => 0);
    if (buttonCount === 0) continue;

    const buttonVisible = await isReallyVisible(button);
    if (!buttonVisible) continue;

    await button.click({ timeout: 5000 });
    await page.waitForTimeout(2000);

    return true;
  }

  return false;
}