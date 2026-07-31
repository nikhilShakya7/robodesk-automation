const { chromium } = require('@playwright/test');
(async () => {
  const browser = await chromium.launch({ headless: false, args: ['--no-sandbox','--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.goto('http://robodesk1.local/robodesk-support/');
  await page.waitForLoadState('networkidle');
  const toggle = page.locator('button.robodesk-toggle-btn').first();
  console.log('toggle count', await toggle.count());
  if (await toggle.count()) {
    await toggle.click();
    await page.waitForTimeout(5000);
  }
  const frames = page.frames().map(f => ({url: f.url(), name: f.name()}));
  console.log('frames', JSON.stringify(frames, null, 2));
  const elements = await page.evaluate(() => {
    const list = [];
    const nodes = Array.from(document.querySelectorAll('*'));
    for (const el of nodes) {
      const text = el.textContent?.trim().slice(0, 200) || '';
      const cls = el.className || '';
      if (/(email|continue|login|customer|chat|support|robodesk)/i.test(text + ' ' + cls)) {
        list.push({tag: el.tagName, id: el.id, cls, role: el.getAttribute('role'), aria: el.getAttribute && el.getAttribute('aria-label'), text: text.slice(0,200), outer: el.outerHTML.slice(0,400)});
      }
    }
    return list.slice(0, 200);
  });
  console.log(JSON.stringify(elements, null, 2));
  await browser.close();
})();
