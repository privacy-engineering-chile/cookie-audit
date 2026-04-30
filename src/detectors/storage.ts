export async function getStorage(page: any) {
  const result = await page.evaluate(() => {
    const local: Record<string, string> = {};
    const session: Record<string, string> = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)!;
      local[key] = localStorage.getItem(key)!;
    }

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)!;
      session[key] = sessionStorage.getItem(key)!;
    }

    return {
      localStorage: local,
      sessionStorage: session
    };
  });

  return result;
}