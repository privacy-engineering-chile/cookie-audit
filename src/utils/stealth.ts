export async function applyStealth(page: any) {
  await page.addInitScript(() => {
    // 🚫 navigator.webdriver
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false
    });

    // 🌍 languages
    Object.defineProperty(navigator, 'languages', {
      get: () => ['es-CL', 'es', 'en-US']
    });

    // 🔌 plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });

    // 🧠 chrome runtime
    (window as any).chrome = {
      runtime: {}
    };

    // 🔒 permissions API (FIX TS)
    const originalQuery = window.navigator.permissions.query.bind(
      window.navigator.permissions
    );

    window.navigator.permissions.query = (parameters: any) => {
      if (parameters.name === 'notifications') {
        return Promise.resolve({
          state: Notification.permission,
          name: 'notifications',
          onchange: null,
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false
        } as PermissionStatus);
      }

      return originalQuery(parameters);
    };

    // 🕵️ userAgent
    Object.defineProperty(navigator, 'userAgent', {
      get: () =>
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    });
  });
}