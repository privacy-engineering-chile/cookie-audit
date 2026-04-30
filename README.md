# Cookie Audit

Cookie Audit es una herramienta CLI que mide el uso de cookies de un sitio web

![status](https://img.shields.io/badge/status-alpha-orange)

## Qué hace

Ejecuta un navegador y analiza:

- Cookies antes y después del consentimiento  
- Requests de tracking (trackers)  
- Vendors involucrados  
- Presencia y visibilidad del consentimiento  
- Si el consentimiento realmente bloquea el tracking  
- Clasificación de cookies por propósito  
- Estimación de base legal  
- Señales de riesgo y cumplimiento  


## Qué entrega

Cada sitio es evaluado en base a:

### Clasificación de consentimiento

- `good` → consentimiento visible y efectivo  
- `tracking-before-consent` → hay consentimiento, pero no controla el tracking  
- `non-compliant` → tracking sin consentimiento visible  
- `functional-only` → solo cookies esenciales o funcionales  
- `no-tracking` → sin cookies ni tracking detectado  

### Score de cumplimiento (0–100)

Basado en:

- Si el sitio realmente requiere consentimiento  
- Presencia de banner visible  
- Tracking antes del consentimiento  
- Calidad de clasificación de cookies  
- Claridad de la base legal  
- Efectividad del consentimiento  

> Este score es una señal técnica, no asesoría legal.

---

### Intalación

```bash
npm install
npx playwright install
npm run build
```

Uso 
```bash
cookie-audit https://ejemplo.cl
```

Generar JSON

```bash
cookie-audit https://ejemplo.cl --json
```

Fallar por nivel de riesgo
```bash
cookie-audit https://ejemplo.cl --fail-on-risk=high
```

## Salida

El reporte incluye:

- Resumen de cookies y trackers
- Análisis de consentimiento
- Vendors detectados
- Findings
- Score de riesgo
- Score de cumplimiento

Ejemplo de salida
```bash
cookie-audit https://www.ejemplo.cl/

ℹ️ No consent mechanism detected

🍪 Cookie Audit Report
==========================

📊 Summary
──────────
Cookies (before)              : 37
Cookies (after)               : 37
New cookies                   : 0
First-party cookies           : 20
Third-party cookies           : 17
Trackers (before)             : 37
Trackers (after)              : 0
LocalStorage keys             : 21
SessionStorage keys           : 6

🧠 Consent / Analysis
─────────────────────
Visible consent UI            : No
Hidden consent markup         : No
Consent clicked               : No
Classification                : non-compliant

🍪 Cookie Categories
────────────────────
  • other                    15
  • advertisement            10
  • necessary                7
  • analytics                5

🧪 Classification Quality
─────────────────────────
  • database                 22
  • unknown                  14
  • heuristic                1

⏳ Top Persistent Cookies
────────────────────────
  • _ga                      → 400 days
  • _ga_CVCL                 → 400 days
  • IDE                      → 400 days
  • igodigitaltc2            → 400 days
  • _ga_GMKXQPNSW5           → 400 days

⚖️ Legal Basis
──────────────
  • consent                  15
  • unknown                  15
  • contract                 7

  ⚠️ 15 cookies likely require consent
  ❓ 15 cookies with unknown legal basis

🎯 Advertising Cookies
──────────────────────
  • _gcl_au                  advertisement  1P database/high
    Vendor : Google Advertising Products
    Service: Google Ads
  • _fbp                     advertisement  1P database/high
    Vendor : Meta Platforms
    Service: Meta Pixel
  • IDE                      advertisement  3P database/high
    Vendor : Google Advertising Products
    Service: Google Ads
  • _ttp                     advertisement  3P database/high
    Vendor : TikTok Inc.
    Service: TikTok Pixel
  • test_cookie              advertisement  3P database/high
    Vendor : Google Advertising Products
    Service: Google Ads
  • _tt_enable_cookie        advertisement  1P database/high
    Vendor : TikTok Inc.
    Service: TikTok Pixel
  • _ttp                     advertisement  1P database/high
    Vendor : TikTok Inc.
    Service: TikTok Pixel
  • ttcsid                   advertisement  1P database/high
    Vendor : TikTok Inc.
    Service: TikTok Pixel
  • ttcsid_D0EEUDRC77UCMMV6IDS0 advertisement  1P database/high
    Vendor : TikTok Inc.
    Service: TikTok Pixel
  • KADUSERCOOKIE            advertisement  3P heuristic/medium
    Vendor : Unknown advertising vendor

📈 Analytics Cookies
────────────────────
  • _ga                      analytics      1P database/high
    Vendor : Google LLC
    Service: Google Analytics
  • _ga_CVCL                 analytics      1P database/high
    Vendor : Google LLC
    Service: Google Analytics
  • _hjSessionUser_1614665   analytics      1P database/high
    Vendor : Hotjar
    Service: Hotjar
  • _hjSession_1614665       analytics      1P database/high
    Vendor : Hotjar
    Service: Hotjar
  • _ga_GMKXQPNSW5           analytics      1P database/high
    Vendor : Google LLC
    Service: Google Analytics

❓ Unknown / Other Cookies
─────────────────────────
  • _rlid                    other          1P unknown/low
  • igodigitaltc2            other          3P unknown/low
  • igodigitalst_110006489   other          3P unknown/low
  • igodigitalstdomain       other          3P unknown/low
  • _rl_sg                   other          1P unknown/low
  • TestIfCookieP            other          3P unknown/low
  • pbw                      other          3P unknown/low
  • _cc_dc                   other          3P unknown/low
  • _cc_id                   other          3P unknown/low
  • KTPCACOOKIE              other          3P unknown/low
  … and 5 more

🏢 Vendors
──────────
  • google          14 requests
  • hotjar          2 requests
  • tiktok          5 requests
  • meta            4 requests

🚨 Findings
───────────
  🔴 Tracking detected without a visible consent mechanism
  📊 Site likely violates consent requirements
  🔴 15 consent-required cookies set BEFORE consent

📜 Compliance Summary
─────────────────────
  🔴 High risk of non-compliance

⚖️ Legal Compliance
───────────────────
Score                         : 0 (severe-concern)
Consent relevant activity     : Yes

  Reasons:
  • No visible consent mechanism detected
  • 15 consent-required cookies set before consent
  • 37 tracking requests before consent
  • 14 cookies could not be classified
  • 15 cookies have unknown legal basis
  • Consent interaction was not captured

🧮 Risk
───────
Score                         : 80 (high) 🔴

  Issues:
  🔴 No consent mechanism detected but tracking is present
  🟠 Third-party cookies detected
  🟡 Local storage detected (potential tracking)
```


## 🌐 Observatorio

Este proyecto alimenta el Observatorio de Cookies en Chile:

https://observatorio-cookies.privacyengineering.cl/

El objetivo es generar evidencia pública sobre; Uso de cookies, Tracking, Consentimiento, Prácticas de privacidad.

## ⚠️ Limitaciones

El análisis puede variar según:

- Geolocalización
- Estado del navegador
- Carga dinámica del sitio
- Scripts de terceros
- A/B testing
- Detección de bots

Los resultados son aproximaciones técnicas.

## Privacidad
Solo analiza sitios públicos
* No requiere autenticación
* No usar en entornos privados sin autorización

## Open Data

La base de conocimiento está disponible en:

* src/db/cookie.json
* src/db/vendors.json
* src/db/services.json

Esto permite transparencia y reproducibilidad.

**Disclaimer**: Este proyecto entrega análisis técnico y heurístico.
No constituye asesoría legal.

## Sobre el proyecto

Cookie Audit forma parte de Privacy Engineering Chile:

Una iniciativa abierta que busca hacer visible, comprensible e implementable la privacidad.