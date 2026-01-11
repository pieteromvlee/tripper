const puppeteer = require('puppeteer');
const { loadEnv, login, setupBrowserLogging, waitForNetworkIdle } = require('./test-helpers.cjs');

(async () => {
  const env = loadEnv();
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  setupBrowserLogging(page);

  try {
    console.log('📍 Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

    console.log('🔐 Logging in...');
    await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🚀 Opening first trip...');
    await page.waitForSelector('[data-testid="trip-card"], a[href^="/trip/"]', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const tripLink = await page.$('[data-testid="trip-card"] a, a[href^="/trip/"]');
    if (tripLink) {
      await tripLink.click();
    }

    await new Promise(resolve => setTimeout(resolve, 3000));
    await waitForNetworkIdle(page, 5000);

    console.log('📸 Taking full page screenshot...');
    await page.screenshot({
      path: '/tmp/tripper-verify/list-detail-full.png',
      fullPage: false
    });

    console.log('✅ Screenshot saved!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
