const puppeteer = require('puppeteer');
const { loadEnv, login, takeScreenshot, setupBrowserLogging, waitForNetworkIdle } = require('./test-helpers.cjs');

(async () => {
  const env = loadEnv();
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Setup error logging
  setupBrowserLogging(page);

  try {
    console.log('📍 Navigating to app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0', timeout: 30000 });

    console.log('🔐 Logging in...');
    await login(page, env.TEST_USER_EMAIL, env.TEST_USER_PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('🚀 Opening first trip...');
    // Wait for trip cards to load
    await page.waitForSelector('[data-testid="trip-card"], a[href^="/trip/"]', { timeout: 10000 });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click the first trip
    const tripLink = await page.$('[data-testid="trip-card"] a, a[href^="/trip/"]');
    if (tripLink) {
      await tripLink.click();
      console.log('✓ Clicked trip link');
    }

    // Wait for the trip page to load
    await new Promise(resolve => setTimeout(resolve, 3000));
    await waitForNetworkIdle(page, 5000);

    console.log('📸 Taking screenshot of list view...');
    await takeScreenshot(page, 'list-view-with-separators', '/tmp/tripper-verify');

    console.log('✅ Verification complete!');
    console.log('📁 Screenshot saved to: /tmp/tripper-verify/list-view-with-separators.png');

  } catch (error) {
    console.error('❌ Error:', error.message);
    await takeScreenshot(page, 'error-state', '/tmp/tripper-verify');
  } finally {
    await browser.close();
  }
})();
