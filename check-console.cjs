const puppeteer = require('puppeteer');
const { loadEnv, login, waitForNetworkIdle } = require('./test-helpers.cjs');

(async () => {
  const env = loadEnv();
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMessages = [];
  const errors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push({ type: msg.type(), text });
    if (msg.type() === 'error') {
      errors.push(text);
    }
  });

  page.on('pageerror', error => {
    errors.push(`Page error: ${error.message}`);
  });

  try {
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });
    await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.waitForSelector('[data-testid="trip-card"], a[href^="/trip/"]', { timeout: 10000 });
    const tripLink = await page.$('[data-testid="trip-card"] a, a[href^="/trip/"]');
    if (tripLink) {
      await tripLink.click();
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
    await waitForNetworkIdle(page, 5000);

    console.log('\n📊 Console Messages Summary:');
    console.log(`Total messages: ${consoleMessages.length}`);
    console.log(`Errors: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n❌ Errors found:');
      errors.forEach(err => console.log(`  - ${err}`));
    } else {
      console.log('\n✅ No errors detected!');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  } finally {
    await browser.close();
  }
})();
