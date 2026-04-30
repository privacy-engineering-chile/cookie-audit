# Cookie Audit

Cookie Audit es una herramienta CLI que analiza el comportamiento de los sitios web en relación a cookies y mecanismos de consentimiento.

---

## 🔥 Por qué existe

La mayoría de los sitios declaran cómo usan tus datos.
Pocos muestran lo que realmente ocurre.

Cookie Audit cierra esa brecha.

---

## 🔍 ¿Qué hace?

Cookie Audit ejecuta un navegador y mide:

- Cookies antes y después del consentimiento
- Requests de tracking (trackers)
- Vendors involucrados
- Presencia de mecanismos de consentimiento
- Si el consentimiento es visible o está oculto
- Si el consentimiento realmente controla el tracking
- Clasificación de cookies por propósito
- Estimación de base legal del tratamiento
- Señales de riesgo técnico
- Score de cumplimiento legal (heurístico)

---

## 🍪 Clasificación de cookies

Las cookies se clasifican en:

- `necessary` → necesarias para el funcionamiento
- `functional` → preferencias / experiencia
- `analytics` → medición de uso
- `advertisement` → tracking y publicidad
- `security` → protección / fraude
- `other` → desconocidas o no clasificadas

---

## 🧠 Clasificación de consentimiento

Cada sitio recibe una clasificación:

- `good` → consentimiento visible y sin tracking previo
- `tracking-before-consent` → hay consentimiento, pero no bloquea tracking
- `non-compliant` → tracking sin consentimiento visible
- `functional-only` → solo cookies funcionales o esenciales
- `no-tracking` → sin cookies ni tracking detectado

---

## 📊 Score de cumplimiento legal

Se calcula un score de 0 a 100 basado en:

- Si el sitio realmente requiere consentimiento
- Presencia de banner visible
- Cookies que requieren consentimiento antes de aceptarlo
- Tracking antes del consentimiento
- Calidad de clasificación de cookies
- Claridad de la base legal
- Efectividad del consentimiento

Este score es una señal técnica, no constituye asesoría legal.

---

## 🚀 Instalación

```bash
npm install
npx playwright install
npm run build

## Uso
```bash
cookie-audit https://ejemplo.cl

Generar JSON

```bash
cookie-audit https://ejemplo.cl --json

Fallar por nivel de riesgo
```bash
cookie-audit https://ejemplo.cl --fail-on-risk=high

## 📦 Salida

El CLI genera un reporte con:

- Resumen general
- Análisis de consentimiento
- Categorías de cookies
- Calidad de clasificación
- Base legal estimada
- Vendors detectados
- Findings
- Score de cumplimiento
- Score de riesgo

## 🌐 Observatorio

Este proyecto alimenta el Observatorio de Cookies en Chile:

https://observatorio-cookies.privacyengineering.cl/

El objetivo es generar evidencia pública sobre:

- Uso de cookies
- Tracking
- Consentimiento
- Prácticas de privacidad en la web

⚠️ Limitaciones

El análisis puede variar según:

Geolocalización
Estado del navegador
Carga dinámica del sitio
Scripts de terceros
A/B testing
Detección de bots

Los resultados son aproximaciones técnicas.

🔐 Privacidad
Solo analiza sitios públicos
No requiere autenticación
No usar en entornos privados sin autorización
📂 Open Data

La base de conocimiento está disponible en:

src/db/cookie.json
src/db/vendors.json
src/db/services.json

Esto permite transparencia y reproducibilidad.

📜 Disclaimer

Este proyecto entrega análisis técnico y heurístico.
No constituye asesoría legal.

🧭 Sobre el proyecto

Cookie Audit forma parte de Privacy Engineering Chile:

Una iniciativa abierta que busca hacer visible, comprensible e implementable la privacidad en sistemas reales.
